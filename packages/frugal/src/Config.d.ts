import * as esbuild from "esbuild";
import { Exporter } from "./Exporter.ts";
import { Plugin } from "./bundler/Plugin.ts";
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
	buildConfig?: URL;
	serverConfig?: URL;
	staticDir?: string;
};

export type BuildConfig = {
	esbuild?: Pick<
		esbuild.BuildOptions,
		| "preserveSymlinks"
		| "external"
		| "packages"
		| "alias"
		| "loader"
		| "resolveExtensions"
		| "mainFields"
		| "conditions"
		| "publicPath"
		| "inject"
		| "banner"
		| "footer"
		| "plugins"
		| "nodePaths"
		| "sourcemap"
		| "legalComments"
		| "sourceRoot"
		| "sourcesContent"
		| "drop"
		| "dropLabels"
		| "charset"
		| "treeShaking"
		| "ignoreAnnotations"
		| "define"
		| "pure"
		| "jsx"
		| "jsxDev"
		| "jsxFactory"
		| "jsxFragment"
		| "jsxSideEffects"
		| "jsxImportSource"
		| "target" // only for script assets
		| "chunkNames" // only for script assets
		| "entryNames" // only for script assets
		| "assetNames" // only for script assets
	>;
	plugins?: Plugin[];
	cleanAllOutDir?: boolean;
	exporter?: Exporter | false;
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
	readonly server: Promise<FrugalServerConfig>;
	readonly build: Promise<FrugalBuildConfig>;
	readonly serverConfigUrl?: URL;
	readonly buildConfigUrl?: URL;
	readonly staticDir: string;
	readonly tempDir: string;
	readonly buildDir: string;

	resolve(path: string): string;
	validate(): Promise<void>;
}

export interface FrugalBuildConfig {
	readonly global: FrugalConfig;
	readonly plugins: Plugin[];
	readonly cleanAllOutDir: boolean;
	readonly esbuildOptions: BuildConfig["esbuild"];
	readonly exporter: Exporter | undefined;
}

export interface FrugalServerConfig {
	readonly global: FrugalConfig;
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
