import type { BuildCacheData, CacheConfig, CacheEntry } from "../build/BuildCache.js";

export interface BuildSnapshot {
	readonly evicted: CacheEntry[];
	readonly added: CacheEntry[];
	readonly current: CacheEntry[];

	getBody(entry: CacheEntry): Promise<string | undefined>;
}

interface BuildSnapshotCreator {
	load(config: CacheConfig): Promise<BuildSnapshot>;
	create(
		config: CacheConfig,
		data: { current: BuildCacheData; previous: BuildCacheData },
	): BuildSnapshot;
}

export let BuildSnapshot: BuildSnapshotCreator;
