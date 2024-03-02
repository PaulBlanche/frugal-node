export interface Deferred<T> extends Promise<T> {
	readonly state: "pending" | "fulfilled" | "rejected";
	resolve(value?: T | PromiseLike<T>): void;
	// biome-ignore lint/suspicious/noExplicitAny: any reason can be given to reject a promise
	reject(reason?: any): void;
}

interface DeferredMaker {
	create<T>(): Deferred<T>;
}

export const Deferred: DeferredMaker;
