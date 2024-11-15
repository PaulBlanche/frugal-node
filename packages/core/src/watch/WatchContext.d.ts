import type { InternalBuildConfig } from "../BuildConfig.js";
import type { WatchCache } from "./WatchCache.js";
import type { Listener } from "./WatchProcess.js";

export interface WatchContext {
	addEventListener(listener: Listener): void;

	removeEventListener(listener: Listener): void;

	watch(config?: { port?: number | undefined }): Promise<void>;

	dispose(): Promise<void>;
}

export function isInChildWatchProcess(): boolean;

interface WatchContextCreator {
	create(buildConfig: InternalBuildConfig, watchCache: WatchCache): WatchContext;
}

export let WatchContext: WatchContextCreator;
