import type { BuildCache } from "../build/BuildCache.js";
import type { ServerCache } from "../server/ServerCache.js";

interface WatchCache extends BuildCache, ServerCache {}

interface WatchCacheCreator {
	create(): WatchCache;
}

export let WatchCache: WatchCacheCreator;
