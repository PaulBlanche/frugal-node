import * as path from "node:path";
import * as fs from "../utils/fs.js";

/** @type {import('./loadCacheData.ts').loadCacheData} */
export async function loadCacheData(config) {
	try {
		const cachePath = path.resolve(config.dir, "cache.json");
		const data = await fs.readTextFile(cachePath);
		return JSON.parse(data);
	} catch {
		return undefined;
	}
}
