import * as swc from "@swc/core";

type Entry = { node: swc.Node; type: "enter" | "exit" };

type Source = {
	content: string;
	start: number;
	end: number;
};

type Visitor = {
	enter: (
		node: swc.Node,
		getSource: () => Source | undefined,
		// biome-ignore lint/suspicious/noConfusingVoidType: the function can return nothing
	) => Promise<boolean | undefined> | boolean | void;
	exit?: (node: swc.Node) => Promise<void>;
};

export interface ModuleWalker {
	readonly code: string;
	walk(visitor: Visitor): Promise<void>;
}

interface ModuleWalkerMaker {
	create(filePath: string): Promise<ModuleWalker>;
}

export const ModuleWalker: ModuleWalkerMaker;
