import * as esbuild from "esbuild";
import { Plugin } from "../bundler/Plugin.js";
import { Exporter } from "../exporter/Exporter.js";
import * as log from "../utils/log.js";

export type Config = {
	self: string;
	pages: string[];
	outdir?: string;
	log?: Partial<log.LogConfig>;
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
