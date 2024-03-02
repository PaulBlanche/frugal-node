import * as esbuild from "esbuild";
import { FrugalBuildConfig } from "../../Config.ts";

export function cleanOutDir(
	config: FrugalBuildConfig,
	overrideCleanAllOutDir?: boolean,
): esbuild.Plugin;
