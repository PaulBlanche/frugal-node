import type { Listener } from "./WatchProcess.js";

export interface ParentContext {
	addEventListener(listener: Listener): void;

	removeEventListener(listener: Listener): void;

	watch(config?: { port?: number }): Promise<void>;

	dispose(): Promise<void>;
}

interface ParentContextCreator {
	create(): ParentContext;
}

export let ParentContext: ParentContextCreator;
