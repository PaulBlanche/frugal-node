import * as esbuild from "esbuild";
import { EsbuildCompiler, FrugalConfig } from "frugal-node/plugin";

export type Bundle =
	| {
			cssBundle: string;
			entrypoint: string;
			type: "page";
	  }
	| {
			cssBundle: string;
			type: "global";
	  };

export type BundleResult = {
	global: string[];
	page: Record<string, string>;
};

export interface Bundler {
	bundle(
		bundles: Bundle[],
		options: Omit<esbuild.BuildOptions, "entryPoints">,
	): Promise<BundleResult>;
}

interface BundlerMaker {
	create(compiler: EsbuildCompiler, config: FrugalConfig, scope: "page" | "global"): Bundler;
}

export const Bundler: BundlerMaker;
