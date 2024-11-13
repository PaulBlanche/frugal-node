import type * as swc from "@swc/core";

export type Entry = { node: swc.Node; type: "enter" | "exit" };

type Source = {
	content: string;
	start: number;
	end: number;
};

export type GetSource = () => Source | undefined;

type Visitor = {
	enter: (
		node: swc.Node,
		// biome-ignore lint/suspicious/noConfusingVoidType: the function can return nothing
	) => Promise<boolean | undefined> | boolean | void;
	exit?: (node: swc.Node) => Promise<void>;
};

export interface ModuleWalker {
	readonly code: string;
	readonly options:
		| { syntax: "typescript"; tsx: boolean }
		| { syntax: "ecmascript"; jsx: boolean };
	walk(visitor: Visitor): Promise<void>;
	getSource(node: swc.Node): Source | undefined;
}

interface ModuleWalkerCreator {
	create(filePath: string): Promise<ModuleWalker>;
}

export let ModuleWalker: ModuleWalkerCreator;
