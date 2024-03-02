import * as lightningcss from "lightningcss";

export type ClassName =
	| { type: "dependency"; importIdentifier: string; name: string }
	| { type: "local"; name: string; names: ClassName[] }
	| {
			type: "global";
			name: string;
	  };

export interface ModuleCompiler {
	compile(compiledCssPath: string): string;
}

interface ModuleCompilerMaker {
	create(exports: lightningcss.CSSModuleExports): ModuleCompiler;
}

export const ModuleCompiler: ModuleCompilerMaker;
