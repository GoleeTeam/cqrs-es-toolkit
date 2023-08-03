import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
import {
	CurrentSnapshotRepo,
	EsRepo,
	EventStoreDoc,
	EventStoreSchema,
	MongoEventStore,
	PragmaticRepo,
} from '../implementation';
import { Event } from '../event';
import { eventsMap } from './events.fixture';
import { TestAggregate } from './test-aggregate';

describe('PragmaticRepo', function () {
	let eventStoreModel: Model<EventStoreDoc>;
	let mongoEventStore: MongoEventStore;
	let esRepo: EsRepo<TestAggregate>;
	let pragmaticRepo: PragmaticRepo<TestAggregate>;
	let currentSnapshotRepo: CurrentSnapshotRepo<TestAggregate>;

	const uuid1Fixture = 'uuid-1';
	const uuid2Fixture = 'uuid-2';
	const originalDescription = 'created';

	beforeAll(async () => {
		const mongodb = await MongoMemoryReplSet.create({
			replSet: {
				count: 1,
				dbName: 'test',
				storageEngine: 'wiredTiger',
			},
		});
		await mongoose.connect(mongodb.getUri());

		eventStoreModel = await mongoose.model<EventStoreDoc>('EventStore', EventStoreSchema);
		mongoEventStore = new MongoEventStore(eventStoreModel, eventsMap, {
			publish: async (e: Event<unknown>) => {
				console.log(`Fake publisher: ${e.eventName}`);
			},
			publishBatch: async (events: { messageContent: Event<unknown>; routingKey: string }[]) => {
				events.map(e => console.log(`Fake publisher: ${e.routingKey}`));
			},
		});
		esRepo = new EsRepo<TestAggregate>(mongoEventStore, TestAggregate);
		currentSnapshotRepo = new CurrentSnapshotRepo<TestAggregate>(mongoose.connection, TestAggregate);
		pragmaticRepo = new PragmaticRepo<TestAggregate>(esRepo, currentSnapshotRepo);
	});

	afterEach(async function () {
		try {
			await mongoose.connection.collection('TestAggregate_current_snapshot').dropIndex('unique');
			await mongoose.connection.collection('event_store').dropIndex('unique');
		} catch (e) {}

		await eventStoreModel.deleteMany({});
	});

	describe('Create Aggregate', function () {
		beforeEach(async function () {
			const testAggregate = new TestAggregate(uuid1Fixture);
			testAggregate.create(originalDescription);
			await pragmaticRepo.commitAndSave(testAggregate);
		});

		it('should getByIdFromEs the aggregate', async function () {
			expect(await pragmaticRepo.getByIdFromEs(uuid1Fixture)).not.toBeNull();
		});

		it('should findOneFromCurrentSnapshot the document', async function () {
			expect(await pragmaticRepo.findOneFromCurrentSnapshot({ id: uuid1Fixture })).not.toBeNull();
		});

		it('findOneFromCurrentSnapshot return document with attributes', async function () {
			const testDocument = await pragmaticRepo.findOneFromCurrentSnapshot({ id: uuid1Fixture });
			expect(testDocument.description).toEqual(originalDescription);
		});

		it('should have aggregate sequence to 1', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture);
			expect(testAggregate.version).toEqual(1);
		});

		it('should have aggregate sequence to 1 in snapshot', async function () {
			const testAggregate = await pragmaticRepo.findOneFromCurrentSnapshot({ id: uuid1Fixture });
			expect(testAggregate.version).toEqual(1);
		});

		it('should save event sequence to 1 in event store collection', async function () {
			const document = await eventStoreModel.findOne({ aggregate_id: uuid1Fixture });
			expect(document.aggregate_version).toEqual(1);
		});

		it('should save event sequence to 1 in snapshot collection', async function () {
			const document = await currentSnapshotRepo.findOne({ id: uuid1Fixture });
			expect(document.version).toEqual(1);
		});
	});

	describe('Change Aggregate', function () {
		const changedDescription = 'changed';

		beforeEach(async function () {
			const testAggregate = new TestAggregate(uuid1Fixture);
			testAggregate.create(originalDescription);
			testAggregate.change(changedDescription);
			await esRepo.commit(testAggregate);
		});

		it('should change the description', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture);
			expect(testAggregate.description).toEqual(changedDescription);
		});

		it('should have aggregate sequence to 2', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture);
			expect(testAggregate.version).toEqual(2);
		});

		it('should save last event sequence to 2', async function () {
			const document = await eventStoreModel.findOne({ aggregate_id: uuid1Fixture }, undefined, {
				sort: { aggregate_version: -1 },
			});
			expect(document.aggregate_version).toEqual(2);
		});
	});

	describe('Delete Aggregate', function () {
		beforeEach(async function () {
			const testAggregate = new TestAggregate(uuid1Fixture);
			testAggregate.create(originalDescription);
			testAggregate.delete();
			await esRepo.commit(testAggregate);
		});

		it('should not return deleted aggregate by default', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture);
			expect(testAggregate).toBeNull();
		});

		it('should return deleted aggregate with the includeDeleted option', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture, { includeDeleted: true });
			expect(testAggregate).not.toBeNull();
			expect(testAggregate.description).toEqual(originalDescription);
		});
	});

	describe('Transactional behaviour', () => {
		let testAggregate: TestAggregate;
		beforeEach(() => {
			testAggregate = new TestAggregate(uuid1Fixture);
			testAggregate.create(originalDescription);
		});

		describe('Case 1: write to snapshot fail', () => {
			beforeEach(async function () {
				await mongoose.connection
					.collection('TestAggregate_current_snapshot')
					.createIndex({ uniqueAttribute: 1 }, { name: 'unique', unique: true });

				testAggregate.unique('thisIsUnique');
				await pragmaticRepo.commitAndSave(testAggregate);
			});

			it('should not write in the event store', async () => {
				const testAggregate2 = new TestAggregate(uuid2Fixture);
				testAggregate2.create(originalDescription);
				testAggregate2.unique('thisIsUnique');
				await expect(() => pragmaticRepo.commitAndSave(testAggregate2)).rejects.toThrow();
				expect(await pragmaticRepo.getByIdFromEs(uuid2Fixture)).toBeNull();
			});
		});

		describe('Case 2: write to event store fail', () => {
			beforeEach(async () => {
				await mongoose.connection
					.collection('event_store')
					.createIndex({ 'payload.uniqueAttribute': 1 }, { name: 'unique', unique: true });

				testAggregate.unique('thisIsUnique');
				await pragmaticRepo.commitAndSave(testAggregate);
			});

			it('should not write the snapshot', async () => {
				const testAggregate2 = new TestAggregate(uuid2Fixture);
				testAggregate2.create(originalDescription);
				testAggregate2.unique('thisIsUnique');
				await expect(() => pragmaticRepo.commitAndSave(testAggregate2)).rejects.toThrow();
				expect(await pragmaticRepo.findOneFromCurrentSnapshot({ id: uuid2Fixture })).toBeNull();
			});
		});
	});
});
