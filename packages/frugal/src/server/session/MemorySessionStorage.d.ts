import type { SessionStorage } from "./SessionStorage.ts";

interface MemorySessionStorageCreator {
	create(): SessionStorage;
}

export let MemorySessionStorage: MemorySessionStorageCreator;
