import type { FrugalResponse } from "./page/FrugalResponse.js";
import type { ServerCache, ServerCacheStorage } from "./server/ServerCache.js";
import type { Context } from "./server/context.js";
import type { Middleware } from "./server/middleware.js";
import type { SessionStorage } from "./server/session/SessionManager.js";
import type { CookieConfig } from "./utils/cookies.js";
import type { LogConfig } from "./utils/log.js";

export type CompressMethodsObject = {
	gzip: boolean;
	deflate: boolean;
	brotli: boolean;
};

type CompressMethods = boolean | Partial<CompressMethodsObject>;

type CacheHandler = {
	forceRefresh: (params: { url: URL; cache?: ServerCache }) => Promise<boolean> | boolean;
	setupForceGenerate: (response: FrugalResponse) => Promise<void> | void;
	shouldForceGenerate: (request: Request) => Promise<boolean> | boolean;
	cleanupForceGenerate: (response: Response) => Promise<void> | void;
};

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
	cacheStorage?: ServerCacheStorage;
	compress?: { method?: CompressMethods; threshold?: number } | false;
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
	readonly cacheHandler: CacheHandler;
};

interface RuntimeConfigCreator {
	create(config: RuntimeConfig, cacheHandler?: CacheHandler): InternalRuntimeConfig;
}

export let RuntimeConfig: RuntimeConfigCreator;

export class RuntimeConfigError extends Error {}
