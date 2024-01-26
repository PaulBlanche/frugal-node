import * as _fs from "node:fs";
import * as _stream from "node:stream/web";
import * as _type from "./_type/fs.js";
import * as _path from "./path.js";

/**
 * @param {string} src
 * @param {string} dest
 * @param {_type.CopyOptions} [options]
 * @returns {Promise<void>}
 */
export async function copy(src, dest, { overwrite = false } = {}) {
	try {
		return await _fs.promises.cp(src, dest, { force: overwrite });
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function ensureDir(path) {
	try {
		await _fs.promises.mkdir(path, { recursive: true });
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<void>}
 */
export async function ensureFile(path) {
	try {
		await ensureDir(_path.dirname(path));
		await (await _fs.promises.open(path, "a")).close();
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<AsyncIterable<_type.DirEntry>>}
 */
export async function readDir(path) {
	try {
		return await _fs.promises.opendir(path);
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<Uint8Array>}
 */
export async function readFile(path) {
	try {
		return await _fs.promises.readFile(path);
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<string>}
 */
export async function readTextFile(path) {
	try {
		return await _fs.promises.readFile(path, { encoding: "utf-8" });
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @param {_type.RemoveOptions} [options]
 * @returns {Promise<void>}
 */
export async function remove(path, { recursive = false } = {}) {
	try {
		return await _fs.promises.rm(path, { recursive });
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @returns {Promise<_type.FileInfo>}
 */
export async function stat(path) {
	try {
		return await _fs.promises.stat(path);
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @param {Uint8Array | _stream.ReadableStream<Uint8Array>} data
 * @param {_type.WriteFileOptions} options
 * @returns {Promise<void>}
 */
export async function writeFile(path, data, { append = false, createNew = false } = {}) {
	try {
		return await _fs.promises.writeFile(path, data, {
			flag: _flag({ append, createNew }),
		});
	} catch (error) {
		throw _mapError(error);
	}
}

/**
 * @param {string} path
 * @param {string | _stream.ReadableStream<string>} data
 * @param {_type.WriteFileOptions} options
 * @returns {Promise<void>}
 */
export async function writeTextFile(path, data, { append = false, createNew = false } = {}) {
	try {
		return await _fs.promises.writeFile(path, data, {
			flag: _flag({ append, createNew }),
			encoding: "utf-8",
		});
	} catch (error) {
		throw _mapError(error);
	}
}

/** @param {_type.WriteFileOptions} options */
function _flag(options) {
	if (options.append) {
		if (options.createNew) {
			return "ax";
		}

		return "a";
	}
	if (options.createNew) {
		return "wx";
	}

	return "w";
}

/**
 * @param {any} error
 * @returns {Error}
 */
function _mapError(error) {
	if (error.code === "ENOENT") {
		return new NotFound(error.message);
	}
	if (error.code === "EEXIST") {
		return new AlreadyExists(error.message);
	}
	return error;
}

export class AlreadyExists extends Error {}
export class NotFound extends Error {}
