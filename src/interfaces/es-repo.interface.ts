export interface IESRepo<T> {
	commit: (aggregate: T, expectedVersion: number) => Promise<void>;
	getById: (id: string) => Promise<T | null>;
}
