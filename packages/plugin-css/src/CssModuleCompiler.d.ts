import type * as lightningcss from "lightningcss";

export type ClassName =
	| { type: "dependency"; importIdentifier: string; name: string }
	| { type: "local"; name: string; names: ClassName[] }
	| {
			type: "global";
			name: string;
	  };

export interface CssModuleCompiler {
	compile(compiledCssPath: string): string;
}

interface CssModuleCompilerCreator {
	create(exports: lightningcss.CSSModuleExports): CssModuleCompiler;
}

export let CssModuleCompiler: CssModuleCompilerCreator;
