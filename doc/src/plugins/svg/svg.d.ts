import type { GlobalAsset } from "@frugal-node/core/page";
import type { Plugin } from "@frugal-node/core/plugin";

export type SvgOptions = {
	outdir: string;
	filter: RegExp;
	getSpritesheetName: (path: string) => string;
};

export function svg(options?: Partial<SvgOptions>): Plugin;

declare module "@frugal-node/core/page" {
	interface AssetTypes {
		svg: GlobalAsset<"svg"> & { path: string };
	}
}
