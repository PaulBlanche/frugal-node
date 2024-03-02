import { BuildCache } from "../builder/BuildCache.js";
import { ServerCache } from "../server/ServerCache.js";

interface WatchCache extends BuildCache, ServerCache {}

interface WatchCacheMaker {
	create(): WatchCache;
}

export const WatchCache: WatchCacheMaker;
