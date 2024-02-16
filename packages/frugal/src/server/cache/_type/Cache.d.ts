import type {
	LiveGenerationResponse,
	SerializedGenerationResponse,
} from "../../../page/GenerationResponse.js";

export type CacheStorage = {
	set(path: string, response: SerializedGenerationResponse): Promise<void> | void;
	get(
		path: string,
	): Promise<SerializedGenerationResponse | undefined> | SerializedGenerationResponse | undefined;
	delete(path: string): Promise<void> | void;
};

interface RuntimeCache {
	add(response: LiveGenerationResponse): Promise<void>;
	has(path: string): Promise<boolean>;
	get(path: string): Promise<Response | undefined>;
}
