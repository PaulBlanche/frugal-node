/** @import * as webStream from "node:stream/web"; */
/** @import * as fs from "@frugal-node/core/utils/fs"; */

/** @type {Record<string, string|webStream.ReadableStream<string>>} */
let MEMORY_FS = {};

export function emptyMockFs() {
	MEMORY_FS = {};
}

export const MOCK_FS = {
	/** @type {fs.ensureFile}*/
	ensureFile: () => {
		return Promise.resolve();
	},
	/** @type {fs.writeTextFile}*/
	writeTextFile: (path, data) => {
		MEMORY_FS[path] = data;
		return Promise.resolve();
	},
	/** @type {fs.readTextFile}*/
	readTextFile: async (path) => {
		const data = MEMORY_FS[path];

		if (typeof data === "string") {
			return Promise.resolve(data);
		}

		const chunks = [];
		for await (const chunk of data) {
			chunks.push(chunk);
		}
		return chunks.join("");
	},
};
