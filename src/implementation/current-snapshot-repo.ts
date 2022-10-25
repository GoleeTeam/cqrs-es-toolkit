import { Connection, FilterQuery, ProjectionType, QueryOptions, Schema } from 'mongoose';
import { AggregateRoot } from '../aggregate-root';

type ExcludeMatchingProperties<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? never : K }[keyof T]>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type CurrentSnapshot<T> = Readonly<ExcludeMatchingProperties<T, Function>>;

export type Find<T> = [
	filter?: FilterQuery<CurrentSnapshot<T>>,
	projection?: ProjectionType<CurrentSnapshot<T>>,
	options?: QueryOptions<CurrentSnapshot<T>>
];

export class CurrentSnapshotRepo<AggregateType extends AggregateRoot> {
	constructor(private mongoConn: Connection, private readonly aggregateClass: new (...args) => AggregateType) {}

	private schema = new Schema<CurrentSnapshot<AggregateType>>(
		{},
		{ collection: `${this.aggregateClass.name}_current_snapshot`, timestamps: true }
	);
	private model = this.mongoConn.model<CurrentSnapshot<AggregateType>>(
		`${this.aggregateClass.name}_model`,
		this.schema
	);

	async findOne(...args: Find<CurrentSnapshot<AggregateType>>): Promise<CurrentSnapshot<AggregateType> | null> {
		return this.model.findOne(args);
	}

	async findMany(...args: Find<CurrentSnapshot<AggregateType>>): Promise<CurrentSnapshot<AggregateType>[]> {
		return this.model.find(args);
	}

	async save(aggregate: AggregateType, aggregateVersion: number): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		delete aggregate._changes;
		await this.model.findOneAndUpdate({ id: aggregate.id }, { $set: aggregate }, { upsert: true, strict: false });
	}
}
