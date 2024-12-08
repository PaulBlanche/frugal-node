import type { FrugalResponse, SerializedFrugalResponse } from "../page/FrugalResponse.js";

export type CacheStorage = {
	set(path: string, response: SerializedFrugalResponse): Promise<void> | void;
	get(
		path: string,
	): Promise<SerializedFrugalResponse | undefined> | SerializedFrugalResponse | undefined;
};

export interface ServerCache {
	add(response: FrugalResponse): Promise<void>;
	get(path: string): Promise<FrugalResponse | undefined>;
}

interface ServerCacheCreator {
	create(storage: CacheStorage): ServerCache;
}

export let ServerCache: ServerCacheCreator;
