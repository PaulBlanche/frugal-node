import * as esbuild from "esbuild";
import { FrugalBuildConfig } from "../../BuildConfig.js";
import { FrugalConfig } from "../../Config.ts";

export function cleanOutDir(
	config: FrugalConfig,
	buildConfig: FrugalBuildConfig,
	overrideCleanAllOutDir?: boolean,
): esbuild.Plugin;
