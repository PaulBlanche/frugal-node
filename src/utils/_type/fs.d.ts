export type CopyOptions = {
	overwrite?: boolean;
};

export type WriteFileOptions = {
	append?: boolean;
	createNew?: boolean;
};

export type FileInfo = {
	isFile(): boolean;
	isDirectory(): boolean;
	size: number;
	mtime: Date | null;
	atime: Date | null;
	birthtime: Date | null;
};

export type DirEntry = {
	name: string;
	isFile(): boolean;
	isDirectory(): boolean;
};

export type RemoveOptions = {
	recursive?: boolean;
};
