import type * as esbuild from "esbuild";

export type EsbuildContext = esbuild.BuildContext<
	Omit<esbuild.BuildOptions, "metafile"> & { metafile: true }
>;

export type ContextCache = {
	id: string;
	context: EsbuildContext;
};
