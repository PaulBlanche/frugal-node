import type * as esbuild from "esbuild";
import type { FrugalBuildConfig } from "../../BuildConfig.js";
import type { FrugalConfig } from "../../Config.ts";

export function cleanOutDir(
	config: FrugalConfig,
	buildConfig: FrugalBuildConfig,
	overrideCleanAllOutDir?: boolean,
): esbuild.Plugin;
