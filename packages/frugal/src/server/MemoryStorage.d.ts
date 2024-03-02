import { CacheStorage } from "./ServerCache.ts";

interface MemoryStorageMaker {
	create(): CacheStorage;
}

export const MemoryStorage: MemoryStorageMaker;
