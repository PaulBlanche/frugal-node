import type * as esbuild from "esbuild";
import type { FrugalBuildConfig } from "../BuildConfig.js";
import type { FrugalConfig } from "../Config.ts";
import type { Plugin, PrivatePlugin } from "./Plugin.ts";

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
