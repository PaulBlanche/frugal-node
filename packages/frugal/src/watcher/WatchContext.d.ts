import { FrugalBuildConfig } from "../Config.ts";
import { Listener } from "./WatchProcess.ts";
import { WatchOptions } from "./types.ts";

export interface WatchContext {
	addEventListener(listener: Listener): void;

	removeEventListener(listener: Listener): void;

	watch(options: WatchOptions): Promise<void>;

	dispose(): Promise<void>;
}

export function isInChildWatchProcess(): boolean;

interface WatchContextMaker {
	create(config: FrugalBuildConfig): WatchContext;
}

export const WatchContext: WatchContextMaker;
