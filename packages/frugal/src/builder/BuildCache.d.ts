import { GenerationResponse } from "../page/GenerationResponse.js";
import { BuildCacheData, CacheConfig } from "./loadCacheData.js";

export interface BuildCache {
	add(response: GenerationResponse): Promise<void>;
	save(): Promise<void>;
}

interface BuildCacheMaker {
	create(config: CacheConfig, previous?: BuildCacheData): BuildCache;
	load(config: CacheConfig): Promise<BuildCache>;
}

export const BuildCache: BuildCacheMaker;
