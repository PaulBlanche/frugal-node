import type { GenerationResponse } from "../page/GenerationResponse.js";
import type { BuildCacheData, CacheConfig } from "./loadCacheData.js";

export interface BuildCache {
	add(response: GenerationResponse): Promise<void>;
	save(): Promise<void>;
}

interface BuildCacheMaker {
	create(config: CacheConfig, previous?: BuildCacheData): BuildCache;
	load(config: CacheConfig): Promise<BuildCache>;
}

export let BuildCache: BuildCacheMaker;
