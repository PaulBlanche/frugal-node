import type { CacheStorage } from "./ServerCache.ts";

interface MemoryStorageCreator {
	create(): CacheStorage;
}

export let MemoryStorage: MemoryStorageCreator;
