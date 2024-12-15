import type { SessionStorage } from "./SessionManager.js";

interface MemorySessionStorageCreator {
	create(): SessionStorage;
}

export let MemorySessionStorage: MemorySessionStorageCreator;
