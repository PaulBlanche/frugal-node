import type * as esbuild from "esbuild";
import type { InternalRuntimeConfig } from "./RuntimeConfig.js";
import type { Plugin } from "./esbuild/Plugin.js";
import type { Exporter } from "./exporter/Exporter.js";
import type { LogConfig } from "./utils/log.js";

export type BuildConfig = {
	self: string;
	pages: string[];
	runtimeConfigPath?: string;
	outdir?: string;
	staticDir?: string;
	esbuildOptions?: EsbuildOptions;
	plugins?: Plugin[];
	log?: Partial<LogConfig>;
	exporter?: Exporter | false;
};

export type InternalBuildConfig = {
	readonly runtimeConfig: Promise<InternalRuntimeConfig | undefined>;
	readonly runtimeConfigPath: string;
	readonly pages: string[];
	readonly outDir: string;
	readonly cacheDir: string;
	readonly tempDir: string;
	readonly buildDir: string;
	readonly buildCacheDir: string;
	readonly staticDir: string;
	readonly publicDir: string;
	readonly esbuildOptions?: EsbuildOptions;
	readonly plugins: Plugin[];
	readonly rootDir: string;
	readonly exporter: Exporter | undefined;

	validate(): Promise<void>;
};

export type EsbuildOptions = Pick<
	esbuild.BuildOptions,
	| "preserveSymlinks"
	| "external"
	| "packages"
	| "alias"
	| "loader"
	| "resolveExtensions"
	| "mainFields"
	| "minify"
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
>;

interface BuildConfigCreator {
	create(config: BuildConfig): InternalBuildConfig;
}

export let BuildConfig: BuildConfigCreator;

export class BuildConfigError extends Error {}
