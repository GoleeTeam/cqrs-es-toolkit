import { Event } from './event';

// From https://github.com/gregoryyoung/m-r/blob/3dc9c2264188eac783c2e6d76dbd5de9cfd1e757/SimpleCQRS/Domain.cs#L63

export abstract class AggregateRoot {
	public id: string;
	private _changes: Event<unknown>[] = [];
	public version = 0;
	public deleted = false;

	protected constructor(id: string) {
		this.id = id;
	}

	public getUncommittedChanges(): Event<unknown>[] {
		return this._changes;
	}

	public markChangesAsCommitted(): void {
		this._changes = [];
	}

	public loadFromHistory(history: Event<unknown>[]): void {
		history.forEach(e => this.applyChange(e, false));
	}

	public applyChange(event: Event<unknown>, isNew = true): void {
		this.version++;
		event.setAggregateVersion(this.version);

		const handler = this.getEventHandler(event);
		handler.call(this, event);

		isNew && this._changes.push(event);
	}

	protected getEventHandler(event: Event<unknown>): any {
		const handler = `on${event.constructor.name}`;
		return this[handler];
	}
}
