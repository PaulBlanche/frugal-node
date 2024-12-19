import type { ServerCacheStorage } from "./ServerCache.js";

interface MemoryCacheStorageCreator {
	create(): ServerCacheStorage;
}

export let MemoryCacheStorage: MemoryCacheStorageCreator;
