import { FrugalBuildConfig } from "../BuildConfig.js";
import { FrugalConfig } from "../Config.ts";
import { WatchOptions } from "./types.ts";

export interface ChildContext {
	watch(config?: WatchOptions): Promise<void>;

	dispose(): Promise<void>;
}

interface ChildContextMaker {
	create(config: FrugalConfig, buildConfig: FrugalBuildConfig): ChildContext;
}

export const ChildContext: ChildContextMaker;
