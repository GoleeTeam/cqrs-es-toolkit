import { AggregateRoot } from '../aggregate-root';
import { AggregateChanged, AggregateCreated, AggregateDeleted } from './events.fixture';

export class TestAggregate extends AggregateRoot {
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

	private onAggregateCreated({ eventPayload }: AggregateCreated) {
		this.description = eventPayload.description;
	}

	private onAggregateChanged({ eventPayload }: AggregateChanged) {
		this.description = eventPayload.description;
	}

	private onAggregateDeleted(AggregateDeleted) {
		this.deleted = true;
	}
}
