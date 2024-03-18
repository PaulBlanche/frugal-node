import type * as esbuild from "esbuild";
import type { FrugalConfig } from "../Config.ts";

export type Asset = {
	entrypoint: string;
	path: string;
};

type OutputEntryPoint = Omit<esbuild.Metafile["outputs"][string], "entryPoint"> & {
	entryPoint: string;
	path: string;
};

export interface AssetCollector {
	collect(filter: RegExp): Asset[];
}

interface AssetCollectorMaker {
	create(config: FrugalConfig, metafile: esbuild.Metafile): AssetCollector;
}

export let AssetCollector: AssetCollectorMaker;
