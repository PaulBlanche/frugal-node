import { BaseContext } from "./server/context.ts";
import { Middleware } from "./server/middleware.ts";
import { SessionStorage } from "./server/session/SessionStorage.ts";
import { CookieConfig } from "./utils/cookies.ts";
import * as log from "./utils/log.ts";

export type Config = {
	self: string;
	pages: string[];
	log?: Partial<log.LogConfig>;
	outdir?: string;
	staticDir?: string;
	server?: ServerConfig;
};

export type ServerConfig = {
	secure?: boolean;
	port?: number;
	cryptoKey?: string;
	session?: {
		storage: SessionStorage;
		cookie?: CookieConfig;
	};
	csrf?: {
		cookieName?: string;
		fieldName?: string;
		headerName?: string;
		isProtected?: (url: URL) => boolean;
	};
	middlewares?: Middleware<BaseContext>[];
};

export interface FrugalConfig {
	readonly self: string;
	readonly rootDir: string;
	readonly outDir: string;
	readonly publicDir: string;
	readonly cacheDir: string;
	readonly buildCacheDir: string;
	readonly pages: string[];
	readonly server: FrugalServerConfig;
	readonly staticDir: string;
	readonly tempDir: string;
	readonly buildDir: string;

	validate(): Promise<void>;
}

export interface FrugalServerConfig {
	readonly secure: boolean;
	readonly port: number;
	readonly cryptoKey: Promise<CryptoKey | undefined>;
	readonly session: ServerConfig["session"];
	readonly middlewares: Middleware<BaseContext>[];
	readonly csrf: ServerConfig["csrf"];
}

interface FrugalConfigMaker {
	create(config: Config): FrugalConfig;
}

export const FrugalConfig: FrugalConfigMaker;

export class ConfigError extends Error {}
