import type { Element } from "xast";

export type SvgSymbol = {
	viewBox: string;
	path: string;
	id: string;
	gatheredIds: string[];
	defs: Element[];
	symbol: Element;
};

export interface SymbolBuilder {
	build(path: string): Promise<SvgSymbol>;
}

interface SymbolBuilderMaker {
	create(): SymbolBuilder;
}

export let SymbolBuilder: SymbolBuilderMaker;
