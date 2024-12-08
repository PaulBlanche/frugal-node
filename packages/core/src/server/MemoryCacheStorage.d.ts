import type { CacheStorage } from "./ServerCache.js";

interface MemoryCacheStorageCreator {
	create(): CacheStorage;
}

export let MemoryCacheStorage: MemoryCacheStorageCreator;
