import { PrefetchConfig } from "./Prefetcher.js";

export interface PrefetchObserver {
	observe(): void;
	disconnect(): void;
}

interface PrefetchObserverMaker {
	create(config: PrefetchConfig): PrefetchObserver;
}

export const PrefetchObserver: PrefetchObserverMaker;
