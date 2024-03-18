import type { NavigationConfig } from "./Page.js";

export interface NavigationObserver {
	observe(): void;
	disconnect(): void;
}

interface NavigationObserverMaker {
	create(config: NavigationConfig): NavigationObserver;
}

export let NavigationObserver: NavigationObserverMaker;
