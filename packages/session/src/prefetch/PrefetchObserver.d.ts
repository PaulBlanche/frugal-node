import type { PrefetchConfig } from "./Prefetcher.js";

export interface PrefetchObserver {
	observe(): void;
	disconnect(): void;
}

interface PrefetchObserverCreator {
	create(config: PrefetchConfig): PrefetchObserver;
}

export let PrefetchObserver: PrefetchObserverCreator;
