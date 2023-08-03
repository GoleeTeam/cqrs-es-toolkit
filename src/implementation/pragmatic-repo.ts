import { Count, CurrentSnapshot, CurrentSnapshotRepo, Find } from './current-snapshot-repo';
import { AggregateRoot } from '../aggregate-root';
import { IEsRepo } from '../interfaces';

export interface IPragmaticRepo<AggregateType> {
	getByIdFromEs: (aggregateId: string, options?: { includeDeleted: boolean }) => Promise<AggregateType | null>;
	commitAndSave: (aggregate: AggregateType) => Promise<void>;
	findOneFromCurrentSnapshot: (...args: Find<AggregateType>) => Promise<CurrentSnapshot<AggregateType> | null>;
	findManyFromCurrentSnapshot: (...args: Find<AggregateType>) => Promise<CurrentSnapshot<AggregateType>[]>;
	countFromCurrentSnapshot: (...args: Count<AggregateType>) => Promise<number>;
}

export class PragmaticRepo<AggregateType extends AggregateRoot> implements IPragmaticRepo<AggregateType> {
	constructor(
		private readonly esRepo: IEsRepo<AggregateType>,
		private readonly currentSnapshot: CurrentSnapshotRepo<AggregateType>
	) {}

	async getByIdFromEs(aggregate_id: string, options = { includeDeleted: false }): Promise<AggregateType | null> {
		return await this.esRepo.getById(aggregate_id, options);
	}

	async commitAndSave(aggregate: AggregateType): Promise<void> {
		await this.esRepo.commit(aggregate, async () => {
			await this.currentSnapshot.save(aggregate);
		});
	}

	async findOneFromCurrentSnapshot(...args: Find<AggregateType>): Promise<CurrentSnapshot<AggregateType> | null> {
		return await this.currentSnapshot.findOne(...args);
	}

	async findManyFromCurrentSnapshot(...args: Find<AggregateType>): Promise<CurrentSnapshot<AggregateType>[]> {
		return await this.currentSnapshot.findMany(...args);
	}

	async countFromCurrentSnapshot(...args: Count<AggregateType>): Promise<number> {
		return await this.currentSnapshot.count(...args);
	}
}
