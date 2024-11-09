import type { PageAsset } from "@frugal-node/core/page";
import type { Plugin } from "@frugal-node/core/plugin";
import type * as esbuild from "esbuild";

export type ScriptOptions = {
	outdir: string;
	filter: RegExp;
	esbuildOptions?: Omit<
		esbuild.BuildOptions,
		"entryPoints" | "outdir" | "bundle" | "absWorkingDir" | "metafile"
	>;
};

export function script(options?: Partial<ScriptOptions>): Plugin;

declare module "@frugal-node/core/page" {
	interface AssetTypes {
		js: PageAsset<"js", { path: string }>;
	}
}
