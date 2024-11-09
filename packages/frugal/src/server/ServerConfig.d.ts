import type { CookieConfig } from "../utils/cookies.js";
import type { BaseContext } from "./context.js";
import type { Middleware } from "./middleware.js";
import type { SessionStorage } from "./session/SessionStorage.js";

export type ServerConfig = {
	secure?: boolean;
	port?: number;
	cryptoKey?: string;
	session?: {
		storage: SessionStorage;
		cookie?: CookieConfig;
	};
	middlewares?: Middleware<BaseContext>[];
};

export type InternalServerConfig = {
	readonly secure: boolean;
	readonly port: number;
	readonly cryptoKey: Promise<CryptoKey | undefined>;
	readonly session?: {
		storage: SessionStorage;
		cookie: CookieConfig;
	};
	readonly middlewares: Middleware<BaseContext>[];
};

interface ServerConfigCreator {
	create(config: ServerConfig): InternalServerConfig;
}

export let ServerConfig: ServerConfigCreator;
