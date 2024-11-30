import type * as server from "../Server.js";
import type { Internal } from "./ProxyServer.js";
import type { ServerCache } from "./ServerCache.js";

export type Context = server.Context & {
	url: URL;
	watch: boolean;
	request: Request;
	state: Record<string, unknown>;
	cryptoKey: CryptoKey;
	cache?: ServerCache;
	compress?: {
		encodings: string[];
		threshold: number;
	};
	internal: Internal;
};
