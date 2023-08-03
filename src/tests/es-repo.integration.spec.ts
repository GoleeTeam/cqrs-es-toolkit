import { MongoMemoryReplSet } from 'mongodb-memory-server';
import mongoose, { Model } from 'mongoose';
import { EsRepo, EventStoreDoc, EventStoreSchema, MongoEventStore } from '../implementation';
import { Event } from '../event';
import { eventsMap } from './events.fixture';
import { TestAggregate } from './test-aggregate';

describe('EsRepo', function () {
	let eventStoreModel: Model<EventStoreDoc>;
	let mongoEventStore: MongoEventStore;
	let esRepo: EsRepo<TestAggregate>;

	const uuid1Fixture = 'uuid-1';
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
			publishBatch: async (es: { messageContent: Event<unknown>; routingKey: string }[]) => {
				es.map(e => console.log(`Fake publisher: ${e.routingKey}`));
			},
		});
	});

	beforeEach(function () {
		esRepo = new EsRepo<TestAggregate>(mongoEventStore, TestAggregate);
	});

	afterEach(async function () {
		await eventStoreModel.deleteMany({});
	});

	describe('Create Aggregate', function () {
		beforeEach(async function () {
			const testAggregate = new TestAggregate(uuid1Fixture);
			testAggregate.create(originalDescription);
			await esRepo.commit(testAggregate);
		});

		it('should getById the aggregate ', async function () {
			expect(await esRepo.getById(uuid1Fixture)).not.toBeNull();
		});

		it('getById should inflate the attributes ', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture);
			expect(testAggregate.description).toEqual(originalDescription);
		});

		it('should have aggregate sequence to 1', async function () {
			const testAggregate = await esRepo.getById(uuid1Fixture);
			expect(testAggregate.version).toEqual(1);
		});

		it('should save event sequence to 1', async function () {
			const document = await eventStoreModel.findOne({ aggregate_id: uuid1Fixture });
			expect(document.aggregate_version).toEqual(1);
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
});
