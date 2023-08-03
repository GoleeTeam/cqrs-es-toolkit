export interface IEsRepo<T> {
	commit: (aggregate: T, transactionalHook?: () => Promise<void>) => Promise<void>;
	getById: (id: string, options: { includeDeleted: boolean }) => Promise<T | null>;
}
