type Metadata = {
	url: string;
	hash: string | null;
	headers: [string, string][];
	status: number;
	statusText: string;
};

type Entry = { metadata: Metadata; body: ReadableStream<Uint8Array> | null };

export type CacheStorage = {
	set(
		url: string,
		metadata: Metadata,
		body: ReadableStream<Uint8Array> | null,
	): Promise<void> | void;
	get(url: string): Promise<Entry | undefined> | Entry | undefined;
};

export interface ServerCache {
	add(url: string, response: Response): Promise<void>;
	get(url: string): Promise<Response | undefined>;
}

interface ServerCacheCreator {
	create(storage: CacheStorage): ServerCache;
}

export let ServerCache: ServerCacheCreator;
