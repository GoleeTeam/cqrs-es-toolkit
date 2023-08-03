import { AggregateRoot } from '../aggregate-root';
import { AggregateChanged, AggregateCreated, AggregateDeleted, AggregateUnique } from './events.fixture';
export class TestAggregate extends AggregateRoot {
	public uniqueAttribute: string;
	public description: string;
	public deleted = false;

	constructor(id: string) {
		super(id);
	}

	create(description: string) {
		this.applyChange(new AggregateCreated(this.id, { description }));
	}

	change(description: string) {
		this.applyChange(new AggregateChanged(this.id, { description }));
	}

	delete() {
		this.applyChange(new AggregateDeleted(this.id));
	}

	unique(value: string) {
		this.applyChange(new AggregateUnique(this.id, { uniqueAttribute: value }));
	}

	private onAggregateCreated({ eventPayload }: AggregateCreated) {
		this.description = eventPayload.description;
	}

	private onAggregateChanged({ eventPayload }: AggregateChanged) {
		this.description = eventPayload.description;
	}

	private onAggregateUnique({ eventPayload }: AggregateUnique) {
		this.uniqueAttribute = eventPayload.uniqueAttribute;
	}

	private onAggregateDeleted(AggregateDeleted) {
		this.deleted = true;
	}
}
