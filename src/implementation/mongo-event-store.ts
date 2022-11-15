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
				_id: event.eventId,
				aggregate_id: event.aggregateId,
				event_name: event.eventName,
				payload: event.eventPayload,
				aggregate_sequence: event.sequence,
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

	async getAllEvents(skip: number, limit: number, events_name?: string[]): Promise<Event<unknown>[]> {
		const filters = events_name ? { event_name: { $in: events_name } } : {};
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
			const event = new (this.domainEvents.get(e.event_name!)!)(e.aggregate_id, e.payload);
			event.setEventId(e._id.toString());
			event.setSequence(e.aggregate_sequence);
			return event;
		});
	}

	async getDistinctAggregateIdsByEvents(events_name?: string[]): Promise<string[]> {
		const filters = events_name ? { event_name: { $in: events_name } } : {};
		return this.mongoDocModel.distinct('aggregate_id', filters);
	}
}

export const EventStoreSchema = new Schema<any>(
	{
		_id: { type: Types.ObjectId },
		aggregate_id: { type: String, index: true },
		payload: { type: Schema.Types.Mixed },
		event_name: { type: String },
		aggregate_sequence: { type: Number }, // should we add a compound unique index?
	},
	{ timestamps: true, collection: 'event_store' }
);

export type EventStoreDoc = {
	payload: unknown;
	aggregate_id: string;
	event_name: string;
	aggregate_sequence: number;
} & Document;
