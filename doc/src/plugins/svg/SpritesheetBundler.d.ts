import type { SvgSymbol } from "./SymbolBuilder.js";

export interface SpritesheetBundler {
	bundle(name: string, symbols: SvgSymbol[]): string;
}

interface SpritesheetBundlerMaker {
	create(): SpritesheetBundler;
}

export let SpritesheetBundler: SpritesheetBundlerMaker;
