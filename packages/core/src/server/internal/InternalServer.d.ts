import type { InternalRuntimeConfig } from "../../RuntimeConfig.js";
import type { DynamicManifest, StaticManifest } from "../../build/manifest.js";
import type { Server } from "../Server.js";

export type InternalServerConfig = {
	manifest:
		| { static: StaticManifest; dynamic: DynamicManifest }
		| { static: StaticManifest; dynamic?: undefined }
		| { static?: undefined; dynamic: DynamicManifest };
	config: InternalRuntimeConfig;
	watch: boolean;
};

interface InternalServerCreator {
	create(config: InternalServerConfig): Server;
}

export let InternalServer: InternalServerCreator;
