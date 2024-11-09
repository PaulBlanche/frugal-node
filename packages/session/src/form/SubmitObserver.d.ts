import type { NavigationConfig } from "../page/Page.js";

export interface SubmitObserver {
	observe(): void;
	disconnect(): void;
}

interface SubmitObserverCreator {
	create(config: NavigationConfig): SubmitObserver;
}

export let SubmitObserver: SubmitObserverCreator;
