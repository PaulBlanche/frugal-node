import type * as server from "../Server.js";
import type { Session } from "../session/Session.js";

export type Context = server.Context & {
	url: URL;
	watch: boolean;
	request: Request;
	state: Record<string, unknown>;
	session?: Session;
	cryptoKey: CryptoKey;
};
