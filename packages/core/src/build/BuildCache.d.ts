import type { FrugalResponse, SerializedFrugalResponse } from "../page/FrugalResponse.js";

export type CacheConfig = {
	dir: string;
};

export type CacheEntry = Omit<SerializedFrugalResponse, "body"> & {
	age: "new" | "old";
	file?: string;
};

export type BuildCacheData = Record<string, CacheEntry>;

export type SerializedCache = {
	current: BuildCacheData;
	previous: BuildCacheData;
};

export function loadData(config: CacheConfig): Promise<SerializedCache | undefined>;

export interface BuildCache {
	add(response: FrugalResponse): Promise<void>;
	save(): Promise<void>;
}

interface BuildCacheCreator {
	load(config: CacheConfig): Promise<BuildCache>;
}

export let BuildCache: BuildCacheCreator;
