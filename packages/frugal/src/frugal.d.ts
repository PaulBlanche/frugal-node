import { Config } from "./Config.js";
import { WatchContext } from "./watcher/WatchContext.js";

export function build(conf: Config): Promise<void>;

export function context(conf: Config): Promise<WatchContext>;

declare global {
	export interface importMeta {
		environment: "server" | "client";
	}
}
