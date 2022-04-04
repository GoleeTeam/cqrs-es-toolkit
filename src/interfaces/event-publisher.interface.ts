import { Event } from '../event';

export interface IEventPublisher {
	publish: (event: Event) => Promise<void>;
}
