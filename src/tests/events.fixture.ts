import { PublicEvent } from '../event';

export interface IAggregatePayload {
	description: string;
}

export class AggregateCreated extends PublicEvent<IAggregatePayload> {
	constructor(aggregateId: string, payload: IAggregatePayload) {
		super(AggregateCreated.name, aggregateId, payload);
	}
}

export class AggregateChanged extends PublicEvent<IAggregatePayload> {
	constructor(aggregateId: string, payload: IAggregatePayload) {
		super(AggregateChanged.name, aggregateId, payload);
	}
}

export class AggregateDeleted extends PublicEvent<{}> {
	constructor(aggregateId: string) {
		super(AggregateDeleted.name, aggregateId, {});
	}
}

export const eventsMap = new Map<string, any>([
	['AggregateCreated', AggregateCreated],
	['AggregateChanged', AggregateChanged],
	['AggregateDeleted', AggregateDeleted],
]);
