import { BuildConfig } from "./BuildConfig.js";
import { Config } from "./Config.js";
import { WatchContext } from "./watcher/WatchContext.js";

export function build(config: Config, buildConfig: BuildConfig): Promise<void>;

export function context(config: Config, buildConfig: BuildConfig): Promise<WatchContext>;

declare global {
	interface ImportMeta {
		environment: "server" | "client";
	}
}
