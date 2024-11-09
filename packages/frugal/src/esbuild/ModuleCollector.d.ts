import type * as esbuild from "esbuild";

export type CollectedModule = {
	entrypoint: string;
	path: string;
};

export interface ModuleCollector {
	collect(filter: RegExp): CollectedModule[];
}

type Config = {
	rootDir: string;
};

interface ModuleCollectorCreator {
	create(config: Config, metafile: esbuild.Metafile): ModuleCollector;
}

export let ModuleCollector: ModuleCollectorCreator;
