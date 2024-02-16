import type * as esbuild from "esbuild";

export type Asset = {
	entrypoint: string;
	path: string;
};

export type OutputEntryPoint = Omit<esbuild.Metafile["outputs"][string], "entryPoint"> & {
	entryPoint: string;
	path: string;
};
