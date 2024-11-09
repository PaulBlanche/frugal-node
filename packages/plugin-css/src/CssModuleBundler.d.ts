import type * as lightningcss from "lightningcss";

export type CssModule = { contents: Uint8Array; css: Uint8Array; js: string };

export type Config = {
	sourceMap?: boolean;
	projectRoot?: string;
	options?: lightningcss.CSSModulesConfig;
};

export interface CssModuleBundler {
	bundle(path: string, cssPath: string, contents: Uint8Array): CssModule;
}

interface CssModuleBundlerCreator {
	create(config?: Config): CssModuleBundler;
}

export let CssModuleBundler: CssModuleBundlerCreator;
