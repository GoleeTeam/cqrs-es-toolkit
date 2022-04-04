export interface IRepo<T> {
	save: (aggregate: T, expectedVersion: number) => Promise<void>;
	getById: (id: string) => Promise<T | null>;
}
