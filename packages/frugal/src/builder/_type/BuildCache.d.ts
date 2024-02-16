import type { LiveGenerationResponse } from "../../page/GenerationResponse.js";

interface BuildCache {
	add(response: LiveGenerationResponse): Promise<void>;
	save(): Promise<void>;
}
