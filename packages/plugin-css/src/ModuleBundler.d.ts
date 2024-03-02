import type * as lightningcss from "lightningcss";

export type Module = { contents: Uint8Array; css: Uint8Array; js: string };

export type Config = {
	sourceMap?: boolean;
	projectRoot?: string;
	options?: lightningcss.CSSModulesConfig;
};

export interface ModuleBundler {
	bundle(path: string, cssPath: string, contents: Uint8Array): Promise<Module>;
}

interface ModuleBundlerMaker {
	create(config?: Config): ModuleBundler;
}

export const ModuleBundler: ModuleBundlerMaker;
