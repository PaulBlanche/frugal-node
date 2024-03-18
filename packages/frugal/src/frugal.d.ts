import type { BuildConfig } from "./BuildConfig.js";
import type { Config } from "./Config.js";
import type { WatchContext } from "./watcher/WatchContext.js";

export function build(config: Config, buildConfig: BuildConfig): Promise<void>;

export function context(config: Config, buildConfig: BuildConfig): Promise<WatchContext>;

declare global {
	interface ImportMeta {
		environment: "server" | "client";
	}
}
