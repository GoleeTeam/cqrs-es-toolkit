export interface IEsRepo<T> {
	commit: (aggregate: T, expectedVersion: number) => Promise<void>;
	getById: (id: string, options: { includeDeleted: boolean }) => Promise<T | null>;
}
