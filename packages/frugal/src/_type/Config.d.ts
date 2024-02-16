import type * as esbuild from "esbuild";
import type { Plugin } from "../bundler/Plugin.js";
import type { Exporter } from "../exporter/Exporter.js";
import type { BaseContext } from "../server/context.js";
import type { Middleware } from "../server/middleware.js";
import type { SessionStorage } from "../server/session/sessionStorage.js";
import type { CookieConfig } from "../utils/http.js";
import type * as log from "../utils/log.js";

export type Config = {
	self: string;
	pages: string[];
	outdir?: string;
	log?: Partial<log.LogConfig>;
	staticDir?: string;
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
	server?: ServerConfig;
};

type ServerConfig = {
	secure?: boolean;
	port?: number;
	cryptoKey?: CryptoKey;
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
