import * as esbuild from "esbuild";
import { Exporter } from "./Exporter.ts";
import { Plugin } from "./bundler/Plugin.ts";

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

export interface FrugalBuildConfig {
	readonly plugins: Plugin[];
	readonly cleanAllOutDir: boolean;
	readonly esbuildOptions: BuildConfig["esbuild"];
	readonly exporter: Exporter | undefined;
}

interface FrugalBuildConfigMaker {
	create(config: BuildConfig): FrugalBuildConfig;
}

export const FrugalBuildConfig: FrugalBuildConfigMaker;
