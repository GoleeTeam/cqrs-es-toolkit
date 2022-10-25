import { CurrentSnapshot, CurrentSnapshotRepo, Find } from './current-snapshot-repo';
import { AggregateRoot } from '../aggregate-root';
import { IESRepo } from '../interfaces';

export interface IPragmaticRepo<AggregateType> {
	getByIdFromEs: (aggregateId: string) => Promise<AggregateType | null>;
	commitAndSave: (aggregate: AggregateType, aggregateVersion: number) => Promise<void>;
	findOneFromWriteModel: (...args: Find<AggregateType>) => Promise<CurrentSnapshot<AggregateType> | null>;
	findManyFromWriteModel: (...args: Find<AggregateType>) => Promise<CurrentSnapshot<AggregateType>[]>;
}

export class PragmaticRepo<AggregateType extends AggregateRoot> implements IPragmaticRepo<AggregateType> {
	constructor(
		private readonly esRepo: IESRepo<AggregateType>,
		private readonly writeModelRepo: CurrentSnapshotRepo<AggregateType>
	) {}

	async getByIdFromEs(aggregate_id: string): Promise<AggregateType | null> {
		return await this.esRepo.getById(aggregate_id);
	}

	async commitAndSave(aggregate: AggregateType, aggregateVersion: number): Promise<void> {
		await this.esRepo.commit(aggregate, aggregateVersion);
		await this.writeModelRepo.save(aggregate, aggregateVersion);
	}

	async findOneFromWriteModel(...args: Find<AggregateType>): Promise<CurrentSnapshot<AggregateType> | null> {
		return await this.writeModelRepo.findOne(...args);
	}

	async findManyFromWriteModel(...args: Find<AggregateType>): Promise<CurrentSnapshot<AggregateType>[]> {
		return await this.writeModelRepo.findMany(...args);
	}
}
