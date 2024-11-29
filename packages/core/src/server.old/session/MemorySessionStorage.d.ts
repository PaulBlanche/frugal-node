import type { SessionStorage } from "./SessionStorage.js";

interface MemorySessionStorageCreator {
	create(): SessionStorage;
}

export let MemorySessionStorage: MemorySessionStorageCreator;
