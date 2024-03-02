import { GenerationResponse, SerializedGenerationResponse } from "../page/GenerationResponse.js";

export type CacheStorage = {
	set(path: string, response: SerializedGenerationResponse): Promise<void> | void;
	get(
		path: string,
	): Promise<SerializedGenerationResponse | undefined> | SerializedGenerationResponse | undefined;
	delete(path: string): Promise<void> | void;
};

export interface ServerCache {
	add(response: GenerationResponse): Promise<void>;
	has(path: string): Promise<boolean>;
	get(path: string): Promise<Response | undefined>;
}

interface ServerCacheMaker {
	create(storage: CacheStorage): ServerCache;
}

export const ServerCache: ServerCacheMaker;
