import type * as lightningcss from "lightningcss";

type Module = { contents: Uint8Array; css: Uint8Array; js: string };

type Config = {
	sourceMap?: boolean;
	projectRoot?: string;
	options?: lightningcss.CSSModulesConfig;
};
