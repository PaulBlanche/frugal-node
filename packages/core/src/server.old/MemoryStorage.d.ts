import type { CacheStorage } from "./ServerCache.js";

interface MemoryStorageCreator {
	create(): CacheStorage;
}

export let MemoryStorage: MemoryStorageCreator;
