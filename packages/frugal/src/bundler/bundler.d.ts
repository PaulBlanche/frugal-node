import * as esbuild from "esbuild";
import { FrugalBuildConfig } from "../BuildConfig.js";
import { FrugalConfig } from "../Config.ts";
import { Plugin, PrivatePlugin } from "./Plugin.ts";

export function build(
	config: FrugalConfig,
	buildConfig: FrugalBuildConfig,
	extraPlugins?: (Plugin | PrivatePlugin)[],
): Promise<esbuild.BuildResult<esbuild.BuildOptions>>;

export function context(
	config: FrugalConfig,
	buildConfig: FrugalBuildConfig,
	extraPlugins?: (Plugin | PrivatePlugin)[],
): Promise<esbuild.BuildContext<esbuild.BuildOptions>>;
