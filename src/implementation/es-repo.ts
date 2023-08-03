import { AggregateRoot } from '../aggregate-root';
import { IEsRepo, IEventStore } from '../interfaces';

export class EsRepo<AggregateType extends AggregateRoot> implements IEsRepo<AggregateType> {
	constructor(
		private readonly eventStore: IEventStore,
		private readonly aggregateClass: new (...args) => AggregateType
	) {}

	async getById(aggregate_id: string, options = { includeDeleted: false }): Promise<AggregateType | null> {
		const aggregate = new this.aggregateClass(aggregate_id);

		const history = await this.eventStore.getEventsForAggregate(aggregate_id);
		if (history.length === 0) {
			return null;
		}

		aggregate.loadFromHistory(history);

		if (aggregate.deleted && !options.includeDeleted) {
			return null;
		}

		return aggregate;
	}

	async commit(aggregate: AggregateType, transactionalHook?: () => Promise<void>): Promise<void> {
		const uncommittedChanges = aggregate.getUncommittedChanges();
		await this.eventStore.saveEvents(aggregate.id, uncommittedChanges, transactionalHook);
		aggregate.markChangesAsCommitted();
	}
}
