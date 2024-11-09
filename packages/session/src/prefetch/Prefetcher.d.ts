export type PrefetchConfig = {
	defaultPrefetch: boolean;
	timeout: number;
	cooldown: number;
};

export interface Prefetcher {
	schedule(): void;
	cancel(): void;
	addEventListener(type: "disposable", listener: () => void): void;
}

interface PrefetcherCreator {
	prefetchable(config: PrefetchConfig, anchor: HTMLAnchorElement): boolean;
	create(url: URL, config: PrefetchConfig): Prefetcher;
}

export let Prefetcher: PrefetcherCreator;
