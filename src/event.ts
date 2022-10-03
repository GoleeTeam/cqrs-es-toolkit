export abstract class Event<EventPayloadType> {
  abstract readonly eventName: string;
  abstract readonly eventPayload: EventPayloadType;
  abstract readonly aggregateId: string;
}

export class PrivateEvent<EventPayloadType> implements Event<EventPayloadType> {
  readonly isPublic = false;

  constructor(
    readonly aggregateId: string,
    readonly eventName: string,
    readonly eventPayload: EventPayloadType
  ) {}
}
export class PublicEvent<EventPayloadType> implements Event<EventPayloadType> {
  readonly isPublic = true;

  constructor(
    readonly aggregateId: string,
    readonly eventName: string,
    readonly eventPayload: EventPayloadType
  ) {}
}
