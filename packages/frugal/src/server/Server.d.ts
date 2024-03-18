import type * as http from "node:http";
import type { Config, FrugalConfig } from "../Config.ts";
import type { Manifest } from "../builder/manifest.ts";
import type { Handler, ServeOptions } from "../utils/serve.ts";
import type { ServerCache } from "./ServerCache.ts";

export type ServerConfig = {
	config: FrugalConfig | Config;
	watch: boolean;
	manifest: Manifest;
	cache: ServerCache;
};

export interface Server {
	nativeHandler(secure?: boolean): http.RequestListener;
	handler(secure?: boolean): Handler;
	serve(config?: ServeOptions): Promise<void>;
}

interface ServerMaker {
	create(config: ServerConfig): Promise<Server>;
}

export let Server: ServerMaker;
