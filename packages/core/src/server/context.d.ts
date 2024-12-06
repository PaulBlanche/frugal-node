import type * as server from "./Server.js";
import type { ServerCache } from "./ServerCache.js";
import type { Session } from "./session/Session.js";
//import type { ServerCache } from "./ServerCache.js";

export type Context = server.ServerContext & {
	url: URL;
	watch: boolean;
	request: Request;
	state: Record<string, unknown>;
	cryptoKey: Promise<CryptoKey>;
	session?: Session;
	cache?: ServerCache;
	compress?: {
		encodings: string[];
		threshold: number;
	};
	//internal: Internal;
};
