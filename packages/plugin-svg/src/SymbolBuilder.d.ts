import type { Element } from "xast";

export type SvgSymbol = {
	viewBox: string;
	path: string;
	id: string;
	svg: {
		attributes: Record<string, string | null | undefined>;
		gatheredIds: string[];
		defs: Element[];
		content: Element;
	};
};

export interface SymbolBuilder {
	build(path: string): Promise<SvgSymbol>;
}

interface SymbolBuilderMaker {
	create(): SymbolBuilder;
}

export let SymbolBuilder: SymbolBuilderMaker;
