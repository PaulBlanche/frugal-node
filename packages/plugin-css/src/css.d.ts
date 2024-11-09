import type { GlobalAsset, PageAsset } from "@frugal-node/core/page";
import type { Plugin } from "@frugal-node/core/plugin";
import type * as esbuild from "esbuild";
import type { CssModuleOptions } from "./cssModules.js";

export type CssOptions = {
	outdir?: string;
	scope?: "global" | "page";
	globalCss?: string[] | string;
	cssModule?: CssModuleOptions;
	esbuildOptions?: Omit<
		esbuild.BuildOptions,
		"entryPoints" | "outdir" | "bundle" | "absWorkingDir" | "metafile"
	>;
};

export function css(options?: CssOptions): Plugin;

declare module "@frugal-node/core/page" {
	interface AssetTypes {
		css: GlobalAsset<"css", { path: string }> | PageAsset<"css", { path: string }>;
	}
}
