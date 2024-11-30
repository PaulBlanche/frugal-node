import type { InternalRuntimeConfig } from "../RuntimeConfig.js";
import type { DynamicManifest, StaticManifest } from "../build/manifest.js";
import type { Server } from "./Server.js";
import type { ServerCache } from "./proxy/ServerCache.js";

export type FrugalServerConfig = {
	manifest: { static: StaticManifest; dynamic: DynamicManifest };
	publicDir: string;
	watch: boolean;
	config: InternalRuntimeConfig;
	cacheOverride?: ServerCache;
};

interface FrugalServerCreator {
	create(config: FrugalServerConfig): Server;
}

export let FrugalServer: FrugalServerCreator;