import type * as esbuild from "esbuild";
import type { FrugalBuildConfig } from "../BuildConfig.js";
import type { FrugalConfig } from "../Config.js";
import type { WritableManifest } from "../builder/manifest.js";
import type { AssetTypes } from "../page/Assets.ts";
import type { Asset } from "./AssetCollector.ts";

export interface PluginContext {
	readonly config: FrugalConfig;
	readonly buildConfig: FrugalBuildConfig;
	readonly watch: boolean;

	output<TYPE extends keyof AssetTypes>(type: TYPE, asset: AssetTypes[TYPE]): void;

	collect(filter: RegExp, metafile: esbuild.Metafile): Asset[];
}

export interface PrivatePluginContext extends PluginContext {
	readonly manifest: WritableManifest;

	updateManifest(manifest: Omit<WritableManifest, "assets">): void;

	reset(): void;
}

interface PluginContextMaker {
	create(
		config: FrugalConfig,
		buildConfig: FrugalBuildConfig,
		watch?: boolean,
	): PrivatePluginContext;
}

export let PluginContext: PluginContextMaker;
