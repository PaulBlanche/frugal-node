export type WatchOptions = {
	interval?: number;
};

export type FsEvent = {
	type: "create" | "modify" | "remove";
	paths: string[];
};

export interface FileWatcher {
	readonly ready: Promise<void>;
	close(): Promise<void>;
	[Symbol.asyncIterator](): AsyncIterator<FsEvent>;
}

interface FileWatcherCreator {
	watch(paths: string[], otions?: WatchOptions): FileWatcher;
}

export let FileWatcher: FileWatcherCreator;
