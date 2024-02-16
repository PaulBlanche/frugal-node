export type WatchOptions = {
	interval?: number;
};

export type FsEvent = {
	type: "any" | "create" | "modify" | "remove";
	paths: string[];
};
