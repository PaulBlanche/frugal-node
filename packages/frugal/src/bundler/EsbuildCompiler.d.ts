import type * as esbuild from "esbuild";

type EsbuildContext = esbuild.BuildContext<
	Omit<esbuild.BuildOptions, "metafile"> & { metafile: true }
>;

export type EsbuilResult = esbuild.BuildResult<
	Omit<esbuild.BuildOptions, "metafile"> & { metafile: true }
>;

export type ContextCache = {
	id: string;
	context: EsbuildContext;
};

export interface EsbuildCompiler {
	compile(hash: string, options: esbuild.BuildOptions): Promise<EsbuilResult>;
	dispose(): Promise<void>;
}

interface EsbuildCompilerMaker {
	create(name: string): EsbuildCompiler;
}

export let EsbuildCompiler: EsbuildCompilerMaker;
