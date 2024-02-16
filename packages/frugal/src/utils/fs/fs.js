import * as fs from "node:fs";
import * as path from "node:path";
import * as stream from "node:stream";
import * as webStream from "node:stream/web";
import * as fileWatcher from "./FileWatcher.js";
import * as _type from "./_type/fs.js";
import { flag, mapError } from "./utils.js";

/** @typedef {_type.FileInfo} FileInfo */
/** @typedef {fileWatcher.FileWatcher} FileWatcher */
/** @typedef {_type.FsEvent} FsEvent */

/**
 * @param {string} src
 * @param {string} dest
 * @param {_type.CopyOptions} [options]
 * @returns {Promise<void>}
 */
export async function copy(src, dest, { overwrite = false, recursive = false } = {}) {
	try {
		return await fs.promises.cp(src, dest, { force: overwrite, recursive });
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<webStream.ReadableStream<Uint8Array>>}
 */
export async function createReadableStream(path) {
	try {
		return await Promise.resolve(stream.Readable.toWeb(fs.createReadStream(path)));
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function ensureDir(path) {
	try {
		await fs.promises.mkdir(path, { recursive: true });
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} filePath
 * @returns {Promise<void>}
 */
export async function ensureFile(filePath) {
	try {
		await ensureDir(path.dirname(filePath));
		await (await fs.promises.open(filePath, "a")).close();
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<AsyncIterable<_type.DirEntry>>}
 */
export async function readDir(path) {
	try {
		return await fs.promises.opendir(path);
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<Uint8Array>}
 */
export async function readFile(path) {
	try {
		return await fs.promises.readFile(path);
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function readTextFile(path) {
	try {
		return await fs.promises.readFile(path, { encoding: "utf-8" });
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @param {_type.RemoveOptions} [options]
 * @returns {Promise<void>}
 */
export async function remove(path, { recursive = false } = {}) {
	try {
		return await fs.promises.rm(path, { recursive });
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<_type.FileInfo>}
 */
export async function stat(path) {
	try {
		return await fs.promises.stat(path);
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string[]} paths
 * @param {_type.WatchOptions} [options]
 */
export function watch(paths, options) {
	return new fileWatcher.FileWatcher(paths, options);
}

/**
 * @param {string} path
 * @param {Uint8Array | webStream.ReadableStream<Uint8Array>} data
 * @param {_type.WriteFileOptions} options
 * @returns {Promise<void>}
 */
export async function writeFile(path, data, { append = false, createNew = false } = {}) {
	try {
		return await fs.promises.writeFile(path, data, {
			flag: flag({ append, createNew }),
		});
	} catch (error) {
		throw mapError(error);
	}
}

/**
 * @param {string} path
 * @param {string | webStream.ReadableStream<string>} data
 * @param {_type.WriteFileOptions} options
 * @returns {Promise<void>}
 */
export async function writeTextFile(path, data, { append = false, createNew = false } = {}) {
	try {
		return await fs.promises.writeFile(path, data, {
			flag: flag({ append, createNew }),
			encoding: "utf-8",
		});
	} catch (error) {
		throw mapError(error);
	}
}
