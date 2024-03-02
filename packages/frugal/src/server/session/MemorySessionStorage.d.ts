import { SessionStorage } from "./SessionStorage.ts";

interface MemorySessionStorageMaker {
	create(): SessionStorage;
}

export const MemoryStorage: MemorySessionStorageMaker;
