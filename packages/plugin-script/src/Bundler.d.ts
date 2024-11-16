import type { InternalBuildConfig } from "@frugal-node/core/config/build";
import type { CollectedModule, PluginEsbuild } from "@frugal-node/core/plugin";
import type * as esbuild from "esbuild";

export type Facade = {
	entrypoint: string;
	path: string;
	content: string[];
};

export interface Bundler {
	bundle(
		modules: CollectedModule[],
		options: Omit<esbuild.BuildOptions, "entryPoints">,
	): Promise<Record<string, { url: string; size: number }>>;
}

interface BundlerCreator {
	create(compiler: PluginEsbuild, config: InternalBuildConfig): Bundler;
}

export let Bundler: BundlerCreator;
