export class Event<PayloadType> {
  public payload: PayloadType;
  public metadata: EventMetadata;
  public isPublic: boolean;
  public aggregateId: string;

  constructor(aggregateId: string, isPublic: boolean) {
    this.aggregateId = aggregateId
    this.isPublic = isPublic
  }
}

export class DomainEvent<PayloadType> extends Event<PayloadType> {
  constructor(aggregateId: string) {
    super(aggregateId, false)
  }
}

export class PublicDomainEvent<PayloadType> extends Event<PayloadType> {
  constructor(aggregateId: string) {
    super(aggregateId, true)
  }
}

export type EventMetadata = {
  publishedAt: string  // ISO string YYYY-MM-DDTHH:mm:ss.sssZ with UTC offset
}

