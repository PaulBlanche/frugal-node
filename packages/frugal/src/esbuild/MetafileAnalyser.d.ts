import type * as esbuild from "esbuild";

export type Analysis =
	| {
			type: "page";
			entrypoint: string;
			output: string;
			moduleHash: string;
	  }
	| {
			type: "config";
			moduleHash: string;
			output: string;
	  };

export interface MetafileAnalyser {
	analyse(
		outputPath: string,
		output: esbuild.Metafile["outputs"][string],
	): Promise<Analysis | undefined>;
}

type Config = {
	runtimeConfigPath: string;
	rootDir: string;
	pages: string[];
};
interface MetafileAnalyserCreator {
	create(metafile: esbuild.Metafile, config: Config): MetafileAnalyser;
}

export let MetafileAnalyser: MetafileAnalyserCreator;
