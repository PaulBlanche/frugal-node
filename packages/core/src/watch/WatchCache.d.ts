import type { BuildCache } from "../build/BuildCache.js";
import type { SerializedFrugalResponse } from "../page/FrugalResponse.js";
import type { ServerCache } from "../server/proxy/ServerCache.js";

interface WatchCache {
	build: BuildCache;
	server: ServerCache;
}

interface WatchCacheCreator {
	create(config?: {
		file?: string;
		data?: Record<string, SerializedFrugalResponse>;
	}): WatchCache;
}

export let WatchCache: WatchCacheCreator;
