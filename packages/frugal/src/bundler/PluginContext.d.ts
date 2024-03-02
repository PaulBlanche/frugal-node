import * as esbuild from "esbuild";
import { FrugalBuildConfig } from "../BuildConfig.js";
import { FrugalConfig } from "../Config.js";
import { WritableManifest } from "../builder/manifest.js";
import { AssetTypes } from "../page/Assets.ts";
import { Asset } from "./AssetCollector.ts";

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

export const PluginContext: PluginContextMaker;
