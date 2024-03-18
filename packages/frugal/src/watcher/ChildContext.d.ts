import type { FrugalBuildConfig } from "../BuildConfig.js";
import type { FrugalConfig } from "../Config.ts";
import type { WatchCache } from "./WatchCache.js";
import type { WatchOptions } from "./types.ts";

export interface ChildContext {
	watch(config?: WatchOptions): Promise<void>;

	dispose(): Promise<void>;
}

interface ChildContextMaker {
	create(
		config: FrugalConfig,
		buildConfig: FrugalBuildConfig,
		watchCache: WatchCache,
	): ChildContext;
}

export let ChildContext: ChildContextMaker;
