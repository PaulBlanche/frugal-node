import type { Plugin } from "frugal-node/plugin";

export type CssModuleOptions =
	| boolean
	| {
			pattern?: string;
			dashedIdents?: boolean;
	  };

export function cssModules(cssModule: CssModuleOptions): Plugin;
