import { Document, Model, Schema, Types } from 'mongoose';
import { IEventPublisher, IEventStore } from '../interfaces';
import { Event } from '../event';

export class MongoEventStore implements IEventStore {
	constructor(
		private readonly mongoDocModel: Model<EventStoreDoc>,
		private readonly domainEvents: Map<string, Event<unknown>>,
		private readonly publisher?: IEventPublisher
	) {}

	async saveEvents(aggregate_id: string, events: Event<unknown>[]): Promise<void> {
		for (const event of events) {
			await this.mongoDocModel.create({
				_id: new Types.ObjectId(),
				aggregate_id: event.aggregateId,
				event_name: event.eventName,
				payload: event.eventPayload,
			});

			if (this.publisher && event.isPublic) {
				// TODO: needed for amqp-messaging publish interface
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				await this.publisher.publish(event, event.eventName);
			}
		}
	}

	async getEventsForAggregate(aggregate_id: string): Promise<Event<unknown>[]> {
		const eventsDocs = await this.mongoDocModel.find({ aggregate_id: aggregate_id }, null, {
			sort: { _id: 1 },
		});

		return this.mongoDocsToDomainEvents(eventsDocs);
	}

	async getAllEvents(skip: number, limit: number, event_name?: string): Promise<Event<unknown>[]> {
		const filters = event_name ? { event_name } : {};
		const eventsDocs = await this.mongoDocModel.find(filters, null, {
			sort: { _id: 1 },
			skip,
			limit,
		});

		return this.mongoDocsToDomainEvents(eventsDocs);
	}

	private mongoDocsToDomainEvents(docs: EventStoreDoc[]) {
		return docs.map(e => {
			// TODO: bad solution
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			return new (this.domainEvents.get(e.event_name!)!)(e.aggregate_id, e.payload);
		});
	}
}

export const EventStoreSchema = new Schema(
	{
		_id: { type: Types.ObjectId },
		aggregate_id: { type: String, index: true },
		payload: { type: Schema.Types.Mixed },
		event_name: { type: String },
	},
	{ timestamps: false, collection: 'event_store' }
);

export type EventStoreDoc = {
	payload: unknown;
	aggregate_id: string;
	event_name: string;
} & Document;
