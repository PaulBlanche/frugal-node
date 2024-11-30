import type { InternalRuntimeConfig } from "../../RuntimeConfig.js";
import type { DynamicManifest, StaticManifest } from "../../build/manifest.js";
import type { Server } from "../Server.js";
import type { ServerCache } from "./ServerCache.js";
import type { Context } from "./context.js";

type Internal = (
	context: Context,
	action: {
		index: number;
		params: Partial<Record<string, string | string[]>>;
	} & ({ type: "static"; op: "generate" | "refresh" | "serve" } | { type: "dynamic" }),
) => Promise<Response> | Response;

export type ProxyServerConfig = {
	manifest: { static: StaticManifest; dynamic: DynamicManifest };
	publicDir?: string;
	watch: boolean;
	internal: Internal;
	config: InternalRuntimeConfig;
	cacheOverride?: ServerCache;
};

interface ProxyServerCreator {
	create(config: ProxyServerConfig): Server;
}

export let ProxyServer: ProxyServerCreator;
