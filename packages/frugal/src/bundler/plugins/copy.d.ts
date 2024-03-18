import type * as esbuild from "esbuild";

type CopyConfig = {
	from: string;
	to: string;
	recursive?: boolean;
	forgiveNotFound?: boolean;
}[];

export function copy(config: CopyConfig): esbuild.Plugin;
