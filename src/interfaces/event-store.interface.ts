import { Event } from '../event';

export interface IEventStore {
	saveEvents: (
		aggregate_id: string,
		events: Event<unknown>[],
		transactionalHook?: () => Promise<void>
	) => Promise<void>;
	getEventsForAggregate: (aggregate_id: string) => Promise<Event<unknown>[]>;
}
