import type * as http from "node:http";
import type { Manifest } from "../build/manifest.js";
import type { Handler, ServeOptions } from "../utils/serve.js";
import type { ServerCache } from "./ServerCache.js";
import type { InternalServerConfig } from "./ServerConfig.js";

export type Config = {
	config: InternalServerConfig;
	publicDir?: string;
	watch: boolean;
	manifest: Manifest;
	cache: ServerCache;
};

export interface Server {
	nativeHandler(secure?: boolean): http.RequestListener;
	handler(secure?: boolean): Handler;
	serve(config?: ServeOptions): Promise<void>;
}

interface ServerCreator {
	create(config: Config): Server;
}

export let Server: ServerCreator;
