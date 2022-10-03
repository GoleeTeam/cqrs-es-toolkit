export class Event<PayloadType> {
  public eventName: string;
  public payload: PayloadType;
  public aggregateId: string;
  public isPublic: boolean;

  constructor(aggregateId: string, isPublic: boolean) {
    this.aggregateId = aggregateId;
    this.isPublic = isPublic;
  }
}

export class DomainEvent<PayloadType> extends Event<PayloadType> {
  constructor(aggregateId: string) {
    super(aggregateId, false);
  }
}

export class PublicDomainEvent<PayloadType> extends Event<PayloadType> {
  constructor(aggregateId: string) {
    super(aggregateId, true);
  }
}
