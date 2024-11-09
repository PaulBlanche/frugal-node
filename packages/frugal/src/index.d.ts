import type { BuildConfig } from "./BuildConfig.js";
import type { WatchContext } from "./watch/WatchContext.js";

export function build(buildConfig: BuildConfig): Promise<void>;

export function context(buildConfig: BuildConfig): Promise<WatchContext>;

declare global {
	interface ImportMeta {
		environment: "server" | "client";
	}
}
