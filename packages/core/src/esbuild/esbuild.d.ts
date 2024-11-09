import type * as esbuild from "esbuild";
import type { InternalBuildConfig } from "../BuildConfig.js";
import type { InternalPlugin, Plugin } from "./Plugin.js";

export function build(
	buildConfig: InternalBuildConfig,
	extraPlugins?: (Plugin | InternalPlugin)[],
): Promise<esbuild.BuildResult<esbuild.BuildOptions>>;

export function context(
	buildConfig: InternalBuildConfig,
	extraPlugins?: (Plugin | InternalPlugin)[],
): Promise<esbuild.BuildContext<esbuild.BuildOptions>>;

export function defaultEsbuildConfig(watch: boolean): esbuild.BuildOptions;
