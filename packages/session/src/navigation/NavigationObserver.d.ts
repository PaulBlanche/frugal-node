import type { NavigationConfig } from "../page/Page.js";

export interface NavigationObserver {
	observe(): void;
	disconnect(): void;
}

interface NavigationObserverCreator {
	create(config: NavigationConfig): NavigationObserver;
}

export let NavigationObserver: NavigationObserverCreator;
