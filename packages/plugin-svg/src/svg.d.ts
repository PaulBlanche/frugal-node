import type { BaseGlobalAsset, Plugin } from "frugal-node/plugin";

export type SvgOptions = {
	outdir: string;
	filter: RegExp;
	getSpritesheetName: (path: string) => string;
};

export function svg(options?: Partial<SvgOptions>): Plugin;

declare module "frugal-node/plugin" {
	interface AssetTypes {
		svg: BaseGlobalAsset<"svg"> & { path: string };
	}
}
