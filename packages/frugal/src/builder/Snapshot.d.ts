import { CacheConfig, CacheEntry, SerializedCache } from "./loadCacheData.js";

export interface Snapshot {
	readonly evicted: CacheEntry[];
	readonly added: CacheEntry[];
	readonly current: CacheEntry[];

	read(entry: CacheEntry): Promise<string | undefined>;
}

interface SnapshotMaker {
	create(config: CacheConfig, serializedCache: SerializedCache): Snapshot;
	load(config: CacheConfig): Promise<Snapshot>;
}

export const Snapshot: SnapshotMaker;
