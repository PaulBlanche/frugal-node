import * as esbuild from "esbuild";
import { FrugalConfig } from "../Config.ts";

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
	  }
	| {
			type: "css";
			moduleHash: string;
	  };

export interface MetafileAnalyser {
	analyse(
		outputPath: string,
		output: esbuild.Metafile["outputs"][string],
	): Promise<Analysis | undefined>;
}

interface MetafileAnalyserMaker {
	create(metafile: esbuild.Metafile, config: FrugalConfig): MetafileAnalyser;
}

export const MetafileAnalyser: MetafileAnalyserMaker;
