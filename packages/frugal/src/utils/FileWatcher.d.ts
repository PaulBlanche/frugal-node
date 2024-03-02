export type WatchOptions = {
	interval?: number;
};

export type FsEvent = {
	type: "any" | "create" | "modify" | "remove";
	paths: string[];
};

export interface FileWatcher {
	readonly ready: Promise<void>;
	close(): Promise<void>;
	[Symbol.asyncIterator](): AsyncIterator<FsEvent>;
}

interface FileWatcherMaker {
	watch(paths: string[], otions?: WatchOptions): FileWatcher;
}

export const FileWatcher: FileWatcherMaker;
