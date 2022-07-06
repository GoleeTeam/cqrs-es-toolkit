export class Event<PayloadType> {
  public payload: PayloadType;
  public metadata: EventMetadata;
  public isPublic: boolean;

  constructor(isPublic: boolean) {
    this.isPublic = isPublic
  }
}

export class DomainEvent<PayloadType> extends Event<PayloadType> {
  constructor() {
    super(false)
  }
}

export class PublicDomainEvent<PayloadType> extends Event<PayloadType> {
  constructor() {
    super(true)
  }
}

export type EventMetadata = {
  publishedAt: string  // ISO string YYYY-MM-DDTHH:mm:ss.sssZ with UTC offset
}

