import { SessionStorage } from "./SessionStorage.ts";

interface MemorySessionStorageMaker {
	create(): SessionStorage;
}

export const MemorySessionStorage: MemorySessionStorageMaker;
