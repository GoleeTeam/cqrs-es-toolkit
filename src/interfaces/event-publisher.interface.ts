import { Event } from '../event';

export interface IEventPublisher {
	publish: (event: Event<unknown>) => Promise<void>;
}
