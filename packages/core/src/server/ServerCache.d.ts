import type { FrugalResponse, SerializedFrugalResponse } from "../page/FrugalResponse.js";

export type CacheStorage = {
	set(path: string, response: SerializedFrugalResponse): Promise<void> | void;
	get(
		path: string,
	): Promise<SerializedFrugalResponse | undefined> | SerializedFrugalResponse | undefined;
	delete(path: string): Promise<void> | void;
};

export interface ServerCache {
	add(response: FrugalResponse): Promise<void>;
	has(path: string): Promise<boolean>;
	get(path: string): Promise<Response | undefined>;
}

interface ServerCacheCreator {
	create(storage: CacheStorage): ServerCache;
}

export let ServerCache: ServerCacheCreator;
