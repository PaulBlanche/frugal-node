import type * as esbuild from "esbuild";
import type { InternalBuildConfig } from "../BuildConfig.js";
import type { WritableManifest } from "../build/manifest.js";
import type { AssetTypes } from "../page/PageAssets.js";
import type { CollectedModule } from "./ModuleCollector.js";

export type Plugin = {
	name: string;
	setup: (build: esbuild.PluginBuild, context: PluginContext) => void | Promise<void>;
};

export type InternalPlugin = {
	name: string;
	setup: (build: esbuild.PluginBuild, context: InternalPluginContext) => void | Promise<void>;
};

export interface PluginContext {
	readonly buildConfig: InternalBuildConfig;
	readonly watch: boolean;

	output<TYPE extends keyof AssetTypes>(type: TYPE, asset: AssetTypes[TYPE]): void;

	collectModules(filter: RegExp, metafile: esbuild.Metafile): CollectedModule[];
}

export interface InternalPluginContext extends PluginContext {
	readonly manifest: WritableManifest;

	updateManifest(manifest: Omit<WritableManifest, "assets">): void;

	reset(): void;
}

interface PluginContextCreator {
	external(buildConfig: InternalBuildConfig, watch?: boolean): PluginContext;
	internal(buildConfig: InternalBuildConfig, watch?: boolean): InternalPluginContext;
}

export let PluginContext: PluginContextCreator;

export function wrapErrors(plugin: esbuild.Plugin): esbuild.Plugin;
