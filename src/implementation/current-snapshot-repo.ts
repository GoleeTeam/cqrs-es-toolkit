import { Connection, FilterQuery, Model, PipelineStage, ProjectionType, QueryOptions, Schema } from 'mongoose';
import { AggregateRoot } from '../aggregate-root';

type ExcludeMatchingProperties<T, V> = Pick<T, { [K in keyof T]-?: T[K] extends V ? never : K }[keyof T]>;

// eslint-disable-next-line @typescript-eslint/ban-types
export type CurrentSnapshot<T> = Readonly<ExcludeMatchingProperties<T, Function>>;

export type Find<T> = [
	filter?: FilterQuery<CurrentSnapshot<T>>,
	projection?: ProjectionType<CurrentSnapshot<T>>,
	options?: QueryOptions<CurrentSnapshot<T>>
];

export type Count<T> = [filter?: FilterQuery<CurrentSnapshot<T>>, options?: QueryOptions<CurrentSnapshot<T>>];

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
		args[0] = { ...{ deleted: false }, ...(args[0] || {}) };
		args[2] = { ...(args[2] || {}), ...{ strict: false, strictQuery: false, lean: true } };
		return this.model.findOne(...args);
	}

	async findMany(...args: Find<CurrentSnapshot<AggregateType>>): Promise<CurrentSnapshot<AggregateType>[]> {
		args[0] = { ...{ deleted: false }, ...(args[0] || {}) };
		args[2] = { ...(args[2] || {}), ...{ strict: false, strictQuery: false, lean: true } };
		return this.model.find(...args);
	}

	async count(...args: Count<CurrentSnapshot<AggregateType>>): Promise<number> {
		args[0] = { ...{ deleted: false }, ...(args[0] || {}) };
		args[1] = { ...(args[1] || {}), ...{ strict: false, strictQuery: false, lean: true } };
		return this.model.countDocuments(...args);
	}

	async save(aggregate: AggregateType): Promise<void> {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		//@ts-ignore
		delete aggregate._changes;
		const _aggregate = JSON.parse(JSON.stringify(aggregate));
		await this.model.findOneAndUpdate({ id: aggregate.id }, { $set: _aggregate }, { upsert: true, strict: false });
	}
}
