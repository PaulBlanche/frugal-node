/** @import * as self from "./fs.js" */

import * as fs from "node:fs";
import * as path from "node:path";
import * as stream from "node:stream";

/** @type {self.copy} */
export async function copy(src, dest, { overwrite = false, recursive = false } = {}) {
	try {
		return await fs.promises.cp(src, dest, { force: overwrite, recursive });
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.createReadableStream} */
export async function createReadableStream(path) {
	try {
		return await Promise.resolve(stream.Readable.toWeb(fs.createReadStream(path)));
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.ensureDir} */
export async function ensureDir(path) {
	try {
		await fs.promises.mkdir(path, { recursive: true });
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.ensureFile} */
export async function ensureFile(filePath) {
	try {
		await ensureDir(path.dirname(filePath));
		await (await fs.promises.open(filePath, "a")).close();
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.readDir} */
export async function readDir(path) {
	try {
		return await fs.promises.opendir(path);
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.readFile} */
export async function readFile(path) {
	try {
		return await fs.promises.readFile(path);
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.readTextFile} */
export async function readTextFile(path) {
	try {
		return await fs.promises.readFile(path, { encoding: "utf-8" });
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.remove} */
export async function remove(path, { recursive = false } = {}) {
	try {
		return await fs.promises.rm(path, { recursive });
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.stat} */
export async function stat(path) {
	try {
		return await fs.promises.stat(path);
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.writeFile} */
export async function writeFile(path, data, { append = false, createNew = false } = {}) {
	try {
		return await fs.promises.writeFile(path, data, {
			flag: flag({ append, createNew }),
		});
	} catch (error) {
		throw mapError(error);
	}
}

/** @type {self.writeTextFile} */
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

/** @param {self.WriteFileOptions} options */
export function flag(options) {
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
export function mapError(error) {
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
