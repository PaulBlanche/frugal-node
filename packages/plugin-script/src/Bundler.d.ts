import * as esbuild from "esbuild";
import { Asset, EsbuildCompiler, FrugalConfig } from "frugal-node/plugin";

export type Facade = {
	entrypoint: string;
	path: string;
	content: string[];
};

export interface Bundler {
	bundle(
		assets: Asset[],
		options: Omit<esbuild.BuildOptions, "entryPoints">,
	): Promise<Record<string, string>>;
}

interface BundlerMaker {
	create(compiler: EsbuildCompiler, config: FrugalConfig): Bundler;
}

export const Bundler: BundlerMaker;
