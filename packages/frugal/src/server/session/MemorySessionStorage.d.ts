import type { SessionStorage } from "./SessionStorage.ts";

interface MemorySessionStorageMaker {
	create(): SessionStorage;
}

export let MemorySessionStorage: MemorySessionStorageMaker;
