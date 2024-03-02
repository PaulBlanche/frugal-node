import { Listener } from "./WatchProcess.js";

export interface ParentContext {
	addEventListener(listener: Listener): void;

	removeEventListener(listener: Listener): void;

	watch(): Promise<void>;

	dispose(): Promise<void>;
}

interface ParentContextMaker {
	create(): ParentContext;
}

export const ParentContext: ParentContextMaker;
