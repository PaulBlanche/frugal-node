import type { BuildCache } from "../builder/BuildCache.js";
import type { ServerCache } from "../server/ServerCache.js";

interface WatchCache extends BuildCache, ServerCache {}

interface WatchCacheMaker {
	create(): WatchCache;
}

export let WatchCache: WatchCacheMaker;
