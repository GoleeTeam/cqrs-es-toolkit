import { EsRepo } from './es-repo';
import { AggregateRoot } from '../aggregate-root';
import { PublicEvent } from '../event';

class AggregateRootFixture extends AggregateRoot {
	constructor(id: string) {
		super(id);
	}

	private onCreatedEvent({}) {}

	private onDeletedEvent({}) {
		this.deleted = true;
	}
}

class CreatedEvent extends PublicEvent<any> {
	constructor(id: string) {
		super(CreatedEvent.name, id, {});
	}
}

class DeletedEvent extends PublicEvent<any> {
	constructor(id: string) {
		super(DeletedEvent.name, id, {});
	}
}

describe('es-repo', function () {
	const fakeEventStore = { getEventsForAggregate: jest.fn(), saveEvents: jest.fn() };
	let esRepo: EsRepo<AggregateRootFixture>;
	let aggregateIdFixture = 'uuid-fixture';

	beforeEach(function () {
		esRepo = new EsRepo(fakeEventStore, AggregateRootFixture);
	});

	afterEach(function () {
		jest.resetAllMocks();
		jest.clearAllMocks();
	});

	describe('getById', function () {
		describe('Case 1: Not existing Aggregate', function () {
			beforeEach(() => {
				fakeEventStore.getEventsForAggregate.mockResolvedValue([]);
			});

			it('should return the null', async function () {
				expect(await esRepo.getById(aggregateIdFixture)).toBeNull();
			});
		});

		describe('Case 2: Existing Aggregate', function () {
			beforeEach(() => {
				fakeEventStore.getEventsForAggregate.mockResolvedValue([new CreatedEvent(aggregateIdFixture)]);
			});

			it('should return the aggregate', async function () {
				expect(await esRepo.getById(aggregateIdFixture)).not.toBeNull();
			});

			it('should return the aggregate regardless the includeDeleted option', async function () {
				expect(await esRepo.getById(aggregateIdFixture, { includeDeleted: true })).not.toBeNull();
			});
		});

		describe('Case 3: Deleted Aggregate', function () {
			beforeEach(() => {
				fakeEventStore.getEventsForAggregate.mockResolvedValue([new DeletedEvent(aggregateIdFixture)]);
			});

			it('should not return deleted aggregates by default', async function () {
				expect(await esRepo.getById(aggregateIdFixture)).toBeNull();
			});

			it('should return deleted aggregates if includeDeleted option is set', async function () {
				expect(await esRepo.getById(aggregateIdFixture, { includeDeleted: true })).not.toBeNull();
			});
		});
	});
});
