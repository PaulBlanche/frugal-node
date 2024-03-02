import type * as esbuild from "esbuild";
import type { BasePageAsset, Plugin } from "frugal-node/plugin";

export type ScriptOptions = {
	outdir: string;
	filter: RegExp;
	esbuildOptions?: Omit<
		esbuild.BuildOptions,
		"entryPoints" | "outdir" | "bundle" | "absWorkingDir" | "metafile"
	>;
};

export function script(options?: Partial<ScriptOptions>): Plugin;

declare module "frugal-node/plugin" {
	interface AssetTypes {
		js: BasePageAsset<"js"> & { path: string };
	}
}
