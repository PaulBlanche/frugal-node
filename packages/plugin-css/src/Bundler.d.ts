import type { InternalBuildConfig } from "@frugal-node/core/config/build";
import type { PluginEsbuild } from "@frugal-node/core/plugin";
import type * as esbuild from "esbuild";

export type Bundle =
	| {
			cssBundle: string;
			entrypoint: string;
			type: "page";
	  }
	| {
			cssBundle: string;
			type: "global";
	  };

export type BundleResult = {
	global: { src: string; sourceMap?: string }[];
	page: Record<string, { src: string; sourceMap?: string }>;
};

export interface Bundler {
	bundle(
		bundles: Bundle[],
		options: Omit<esbuild.BuildOptions, "entryPoints">,
	): Promise<BundleResult>;
}

interface BundlerCreator {
	create(compiler: PluginEsbuild, config: InternalBuildConfig, scope: "page" | "global"): Bundler;
}

export let Bundler: BundlerCreator;
