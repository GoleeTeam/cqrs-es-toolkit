import { Event } from '../event';

export interface IEventPublisher {
	publish: (event: Event<unknown>, routingKey: string) => Promise<void>
	publishBatch: (events: { messageContent: Event<unknown>; routingKey: string }[]) => Promise<void>
}
