import { Connection, FilterQuery, Model, ProjectionType, QueryOptions, Schema } from 'mongoose';
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
	private readonly schema: Schema<CurrentSnapshot<AggregateType>>;
	private readonly model: Model<CurrentSnapshot<AggregateType>>;

	constructor(private mongoConn: Connection, private readonly aggregateClass: new (...args) => AggregateType) {
		this.schema = new Schema<CurrentSnapshot<AggregateType>>(
			{},
			{ collection: `${this.aggregateClass.name}_current_snapshot`, timestamps: true, id: false }
		);
		this.schema.index({ id: 1 }, { unique: true });

		this.model = this.mongoConn.model<CurrentSnapshot<AggregateType>>(
			`${this.aggregateClass.name}_model`,
			this.schema
		);
	}

	async findOne(...args: Find<CurrentSnapshot<AggregateType>>): Promise<CurrentSnapshot<AggregateType> | null> {
		args[2] = { ...(args[2] || {}), ...{ strict: false, strictQuery: false, lean: true, deleted: false } };
		return this.model.findOne(...args);
	}

	async findMany(...args: Find<CurrentSnapshot<AggregateType>>): Promise<CurrentSnapshot<AggregateType>[]> {
		args[2] = { ...(args[2] || {}), ...{ strict: false, strictQuery: false, lean: true, deleted: false } };
		return this.model.find(...args);
	}

	async save(aggregate: AggregateType): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		delete aggregate._changes;
		await this.model.findOneAndUpdate({ id: aggregate.id }, { $set: aggregate }, { upsert: true, strict: false });
	}
}
