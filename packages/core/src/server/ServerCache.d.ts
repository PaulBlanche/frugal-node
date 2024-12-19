import type { FrugalResponse, SerializedFrugalResponse } from "../page/FrugalResponse.js";

export type ServerCacheStorage = {
	set(path: string, response: SerializedFrugalResponse): Promise<void> | void;
	get(
		path: string,
	): Promise<SerializedFrugalResponse | undefined> | SerializedFrugalResponse | undefined;
	delete(path: string): Promise<void> | void;
};

export interface ServerCache {
	add(response: FrugalResponse): Promise<void>;
	get(path: string): Promise<FrugalResponse | undefined>;
	invalidate(path: string): Promise<void>;
}

interface ServerCacheCreator {
	create(storage: ServerCacheStorage): ServerCache;
}

export let ServerCache: ServerCacheCreator;
