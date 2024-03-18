import type { CacheStorage } from "./ServerCache.ts";

interface MemoryStorageMaker {
	create(): CacheStorage;
}

export let MemoryStorage: MemoryStorageMaker;
