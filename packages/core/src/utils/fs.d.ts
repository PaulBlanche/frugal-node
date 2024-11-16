import type * as webStream from "node:stream/web";

export type CopyOptions = {
	recursive?: boolean;
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

export function copy(src: string, dest: string, option?: CopyOptions): Promise<void>;

export function createReadableStream(path: string): Promise<webStream.ReadableStream<Uint8Array>>;

export function createWritableStream(
	path: string,
	options?: WriteFileOptions,
): Promise<webStream.WritableStream<Uint8Array>>;

export function ensureDir(path: string): Promise<void>;

export function ensureFile(filePath: string): Promise<void>;

export function readDir(path: string): Promise<AsyncIterable<DirEntry>>;

export function readFile(path: string): Promise<Uint8Array>;

export function readTextFile(path: string): Promise<string>;

export function remove(path: string, options?: RemoveOptions): Promise<void>;

export function stat(path: string): Promise<FileInfo>;

export function writeFile(
	path: string,
	data: Uint8Array | webStream.ReadableStream<Uint8Array>,
	options?: WriteFileOptions,
): Promise<void>;

export function writeTextFile(
	path: string,
	data: string | webStream.ReadableStream<string>,
	options?: WriteFileOptions,
): Promise<void>;

// biome-ignore lint/suspicious/noExplicitAny: ok
export function mapError(error: any): Error;

export class AlreadyExists extends Error {}
export class NotFound extends Error {}
