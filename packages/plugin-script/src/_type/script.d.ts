import type * as esbuild from "esbuild";
import type { BasePageAsset } from "frugal/plugin";

export type ScriptOptions = {
	outdir: string;
	filter: RegExp;
	esbuildOptions?: Omit<
		esbuild.BuildOptions,
		"entryPoints" | "outdir" | "bundle" | "absWorkingDir" | "metafile"
	>;
};

declare module "frugal/plugin" {
	interface AssetTypes {
		js: BasePageAsset<"js"> & { path: string };
	}
}
