import type { SerializedGenerationResponse } from "../page/GenerationResponse.js";

export type CacheConfig = {
	dir: string;
};

export type CacheEntry = Omit<SerializedGenerationResponse, "body"> & {
	age: "new" | "old";
	doc?: string;
};

export type BuildCacheData = Record<string, CacheEntry>;

export type SerializedCache = { current: BuildCacheData; previous: BuildCacheData };

export function loadCacheData(config: CacheConfig): Promise<SerializedCache | undefined>;
