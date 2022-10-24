import { AggregateRoot } from '../aggregate-root';
import { IESRepo, IEventStore } from '../interfaces';

export class EsRepo<AggregateType extends AggregateRoot> implements IESRepo<AggregateType> {
	constructor(
		private readonly eventStore: IEventStore,
		private readonly aggregateClass: new (...args) => AggregateType
	) {}

	async getById(aggregate_id: string): Promise<AggregateType | null> {
		const aggregate = new this.aggregateClass(aggregate_id);
		const history = await this.eventStore.getEventsForAggregate(aggregate_id);
		if (history.length === 0) return null;
		aggregate.loadFromHistory(history);
		return aggregate;
	}

	async commit(aggregate: AggregateType): Promise<void> {
		const uncommittedChanges = aggregate.getUncommittedChanges();
		await this.eventStore.saveEvents(aggregate.id, uncommittedChanges);
		aggregate.markChangesAsCommitted();
	}
}
