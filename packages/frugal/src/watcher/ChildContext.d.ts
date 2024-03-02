import { FrugalBuildConfig } from "../Config.ts";
import { WatchOptions } from "./types.ts";

export interface ChildContext {
	watch(config?: WatchOptions): Promise<void>;

	dispose(): Promise<void>;
}

interface ChildContextMaker {
	create(config: FrugalBuildConfig): ChildContext;
}

export const ChildContext: ChildContextMaker;
