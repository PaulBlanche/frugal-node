import type { FrugalBuildConfig } from "../BuildConfig.js";
import type { FrugalConfig } from "../Config.ts";
import type { WatchCache } from "./WatchCache.js";
import type { Listener } from "./WatchProcess.ts";
import type { WatchOptions } from "./types.ts";

export interface WatchContext {
	addEventListener(listener: Listener): void;

	removeEventListener(listener: Listener): void;

	watch(options?: WatchOptions): Promise<void>;

	dispose(): Promise<void>;
}

export function isInChildWatchProcess(): boolean;

interface WatchContextMaker {
	create(
		config: FrugalConfig,
		buildConfig: FrugalBuildConfig,
		watchCache: WatchCache,
	): WatchContext;
}

export let WatchContext: WatchContextMaker;
