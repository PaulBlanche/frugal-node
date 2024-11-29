import type { InternalRuntimeConfig } from "../../RuntimeConfig.js";
import type { DynamicManifest, StaticManifest } from "../../build/manifest.js";
import type { Server } from "../Server.js";
import type { ServerCache } from "./ServerCache.js";
import type { Context } from "./context.js";

export type ProxyServerConfig = {
	manifest: { static: StaticManifest; dynamic: DynamicManifest };
	publicDir: string;
	watch: boolean;
	internal: (
		context: Context,
		type: "generate" | "refresh" | "serve",
	) => Promise<Response> | Response;
	config: InternalRuntimeConfig;
	cacheOverride?: ServerCache;
};

interface ProxyServerCreator {
	create(config: ProxyServerConfig): Server;
}

export let ProxyServer: ProxyServerCreator;
