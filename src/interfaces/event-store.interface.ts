import { Event } from '../event';

export interface IEventStore {
	saveEvents: (aggregate_id: string, events: Event[]) => Promise<void>;
	getEventsForAggregate: (aggregate_id: string) => Promise<Event[]>;
}
