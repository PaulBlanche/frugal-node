import type { NavigationConfig } from "./Page.js";

export interface SubmitObserver {
	observe(): void;
	disconnect(): void;
}

interface SubmitObserverMaker {
	create(config: NavigationConfig): SubmitObserver;
}

export let SubmitObserver: SubmitObserverMaker;
