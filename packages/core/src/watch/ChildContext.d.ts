import type { InternalBuildConfig } from "../BuildConfig.js";
import type { WatchCache } from "./WatchCache.js";

export interface ChildContext {
	watch(config?: { port?: number | undefined }): Promise<void>;
	dispose(): Promise<void>;
}

interface ChildContextCreator {
	create(buildConfig: InternalBuildConfig, watchCache: WatchCache): ChildContext;
}

export let ChildContext: ChildContextCreator;
