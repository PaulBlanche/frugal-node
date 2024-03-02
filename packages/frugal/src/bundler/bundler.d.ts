import * as esbuild from "esbuild";
import { FrugalBuildConfig } from "../Config.ts";
import { Plugin, PrivatePlugin } from "./Plugin.ts";

export function build(
	config: FrugalBuildConfig,
	extraPlugins?: (Plugin | PrivatePlugin)[],
): Promise<esbuild.BuildResult<esbuild.BuildOptions>>;

export function context(
	config: FrugalBuildConfig,
	extraPlugins?: (Plugin | PrivatePlugin)[],
): Promise<esbuild.BuildContext<esbuild.BuildOptions>>;
