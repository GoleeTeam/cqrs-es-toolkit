import { Document, FilterQuery, Model, Schema, Types } from 'mongoose';
import { IEventPublisher, IEventStore } from '../interfaces';
import { Event } from '../event';

export class MongoEventStore implements IEventStore {
	constructor(
		private readonly mongoDocModel: Model<EventStoreDoc>,
		private readonly domainEvents: Map<string, Event<unknown>>,
		private readonly publisher?: IEventPublisher
	) {}

	async saveEvents(aggregate_id: string, events: Event<unknown>[], saveHook?: () => Promise<void>): Promise<void> {
		const session = await this.mongoDocModel.startSession();

		try {
			await session.withTransaction(async () => {
				await this.mongoDocModel.insertMany(this.eventsToDocs(events), { session });
				if (saveHook) await saveHook();
			});
		} finally {
			await session.endSession();
		}

		if (this.publisher && events.length !== 0) {
			await this.publisher.publishBatch(this.eventsToPublish(events));
		}
	}

	private eventsToDocs(events: Event<unknown>[]) {
		return events.map(event => ({
			_id: event.eventId,
			aggregate_id: event.aggregateId,
			event_name: event.eventName,
			payload: event.eventPayload,
			aggregate_version: event.aggregateVersion,
			ts: new Date(),
		}));
	}

	private eventsToPublish(events: Event<unknown>[]) {
		return events
			.filter(event => event.isPublic)
			.map(event => ({ messageContent: event, routingKey: event.eventName }));
	}

	async getEventsForAggregate(aggregate_id: string): Promise<Event<unknown>[]> {
		const eventsDocs = await this.mongoDocModel.find({ aggregate_id: aggregate_id }, null, {
			sort: { aggregate_version: 1 },
		});

		return this.mongoDocsToDomainEvents(eventsDocs);
	}

	async getAllEvents(
		skip: number,
		limit: number,
		events_name?: string[],
		start_from_excluded?: string
	): Promise<Event<unknown>[]> {
		const filters: FilterQuery<EventStoreDoc> = {};
		events_name && (filters['event_name'] = { $in: events_name });
		start_from_excluded && (filters['_id'] = { $gt: new Types.ObjectId(start_from_excluded) });

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
			event.setAggregateVersion(e.aggregate_version);
			return event;
		});
	}

	async getDistinctAggregateIdsByEvents(
		events_name?: string[],
		options?: { allowDiskUsage: boolean }
	): Promise<string[]> {
		const filters = events_name ? { event_name: { $in: events_name } } : {};
		const { allowDiskUsage } = options ? options : { allowDiskUsage: false };
		return this.mongoDocModel.distinct('aggregate_id', filters).allowDiskUse(allowDiskUsage);
	}
}

export const EventStoreSchema = new Schema<any>(
	{
		_id: { type: Types.ObjectId },
		aggregate_id: { type: String, index: true },
		payload: { type: Schema.Types.Mixed },
		event_name: { type: String },
		aggregate_version: { type: Number },
	},
	{ timestamps: true, collection: 'event_store' }
);

// this guarantees optimistic locking like mechanism
EventStoreSchema.index({ aggregate_id: 1, aggregate_version: 1 }, { unique: true });

export type EventStoreDoc = {
	payload: unknown;
	aggregate_id: string;
	event_name: string;
	aggregate_version: number;
	ts: Date;
} & Document;
