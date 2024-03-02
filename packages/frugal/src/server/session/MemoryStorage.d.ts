import { SessionStorage } from "./SessionStorage.ts";

interface MemoryStorageMaker {
	create(): SessionStorage;
}

export const MemoryStorage: MemoryStorageMaker;
