export abstract class Event<EventPayloadType> {
  abstract readonly eventName: string;
  abstract readonly aggregateId: string;
  abstract readonly eventPayload: EventPayloadType;
  abstract readonly isPublic: boolean;
}

export class PrivateEvent<EventPayloadType> implements Event<EventPayloadType> {
  readonly isPublic = false;

  constructor(
    readonly eventName: string,
    readonly aggregateId: string,
    readonly eventPayload: EventPayloadType
  ) {}
}
export class PublicEvent<EventPayloadType> implements Event<EventPayloadType> {
  readonly isPublic = true;

  constructor(
    readonly eventName: string,
    readonly aggregateId: string,
    readonly eventPayload: EventPayloadType
  ) {}
}
