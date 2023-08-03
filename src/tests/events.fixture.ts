import { PublicEvent } from '../event';

export interface IAggregateDescriptionPayload {
	description: string;
}
export interface IAggregateUniquePayload {
	uniqueAttribute: string;
}

export class AggregateCreated extends PublicEvent<IAggregateDescriptionPayload> {
	constructor(aggregateId: string, payload: IAggregateDescriptionPayload) {
		super(AggregateCreated.name, aggregateId, payload);
	}
}

export class AggregateChanged extends PublicEvent<IAggregateDescriptionPayload> {
	constructor(aggregateId: string, payload: IAggregateDescriptionPayload) {
		super(AggregateChanged.name, aggregateId, payload);
	}
}

export class AggregateDeleted extends PublicEvent<{}> {
	constructor(aggregateId: string) {
		super(AggregateDeleted.name, aggregateId, {});
	}
}

export class AggregateUnique extends PublicEvent<IAggregateUniquePayload> {
	constructor(aggregateId: string, { uniqueAttribute }: IAggregateUniquePayload) {
		super(AggregateUnique.name, aggregateId, { uniqueAttribute: uniqueAttribute });
	}
}

export const eventsMap = new Map<string, any>([
	['AggregateCreated', AggregateCreated],
	['AggregateChanged', AggregateChanged],
	['AggregateDeleted', AggregateDeleted],
	['AggregateUnique', AggregateUnique],
]);
