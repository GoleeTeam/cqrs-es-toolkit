import { Event } from "./event";

// From https://github.com/gregoryyoung/m-r/blob/3dc9c2264188eac783c2e6d76dbd5de9cfd1e757/SimpleCQRS/Domain.cs#L63

export abstract class AggregateRoot {
  private _changes: Event[] = [];

  public id: string;
  public version = 0;

  public getUncommittedChanges(): Event[] {
    return this._changes;
  }

  public markChangesAsCommitted(): void {
    this._changes = [];
  }

  public loadFromHistory(history: Event[]): void {
    history.forEach((e) => this.applyChange(e, false));
  }

  public applyChange(event: Event, isNew = true): void {
    const handler = this.getEventHandler(event);
    handler.call(this, event);
    isNew && this._changes.push(event);
    this.version++;
  }

  protected getEventHandler(event: Event): any {
    const handler = `on${event.constructor.name}`;
    return this[handler];
  }
}
