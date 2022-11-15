export interface IEsRepo<T> {
	commit: (aggregate: T) => Promise<void>;
	getById: (id: string, options: { includeDeleted: boolean }) => Promise<T | null>;
}
