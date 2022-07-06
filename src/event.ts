export class Event {
  public payload: unknown;
  public metadata: EventMetadata;
  public isPublic: boolean;

  constructor(isPublic: boolean) {
    this.isPublic = isPublic
  }
}

export class DomainEvent extends Event {
  constructor() {
    super(false)
  }
}

export class PublicDomainEvent extends Event {
  constructor() {
    super(true)
  }
}

export type EventMetadata = {
  publishedAt: string  // ISO string YYYY-MM-DDTHH:mm:ss.sssZ with UTC offset
}

