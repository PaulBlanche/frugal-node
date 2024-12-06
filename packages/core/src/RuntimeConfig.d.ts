import type { CacheStorage, ServerCache } from "./server/ServerCache.js";
import type { Context } from "./server/context.js";
import type { Middleware } from "./server/middleware.js";
import type { SessionStorage } from "./server/session/SessionStorage.js";
import type { CookieConfig } from "./utils/cookies.js";
import type { LogConfig } from "./utils/log.js";

export type CompressMethodsObject = {
	gzip: boolean;
	deflate: boolean;
	brotli: boolean;
};

type CompressMethods = boolean | Partial<CompressMethodsObject>;

export type RuntimeConfig = {
	self: string;
	secure?: boolean;
	port?: number;
	cryptoKey: string;
	session?: {
		storage: SessionStorage;
		cookie?: CookieConfig;
	};
	log?: Partial<LogConfig>;
	middlewares?: Middleware<Context>[];
	cacheStorage?: CacheStorage;
	compress?: { method?: CompressMethods; threshold?: number };
};

export type InternalRuntimeConfig = {
	readonly secure: boolean;
	readonly port: number;
	readonly cryptoKey: Promise<CryptoKey>;
	readonly session?: {
		storage: SessionStorage;
		cookie: CookieConfig;
	};
	readonly middlewares: Middleware<Context>[];
	readonly serverCache?: ServerCache;
	readonly compress: { threshold: number; method: CompressMethodsObject };
	readonly self: string;
};

interface RuntimeConfigCreator {
	create(config: RuntimeConfig): InternalRuntimeConfig;
}

export let RuntimeConfig: RuntimeConfigCreator;

export class RuntimeConfigError extends Error {}
