import type * as esbuild from "esbuild";
import type { BaseGlobalAsset, BasePageAsset, Plugin } from "frugal-node/plugin";
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

declare module "frugal-node/plugin" {
	interface AssetTypes {
		css:
			| (BaseGlobalAsset<"css"> & { path: string })
			| (BasePageAsset<"css"> & { path: string });
	}
}
