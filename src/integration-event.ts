export class IntegrationEvent<EventPayloadType> {
	constructor(readonly eventName: string, readonly eventPayload: EventPayloadType) {}
}
