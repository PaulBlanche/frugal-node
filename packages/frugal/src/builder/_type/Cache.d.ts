import type { SerializedGenerationResponse } from "../../page/GenerationResponse.js";

export type CacheConfig = {
	dir: string;
};

export type SnapshotEntry = Omit<SerializedGenerationResponse, "body"> & {
	age: "new" | "old";
	doc?: string;
};

export type Data = Record<string, SnapshotEntry>;

export type SerializedCache = { current: Data; previous: Data };
