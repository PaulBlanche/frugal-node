/** @import * as self from "./BuildSnapshot.js" */
/** @import { CacheEntry } from "../build/BuildCache.js" */

import * as path from "node:path";
import { loadData } from "../build/BuildCache.js";
import * as fs from "../utils/fs.js";

/** @type {self.BuildSnapshotCreator} */
export const BuildSnapshot = {
	load,
	create,
};

/** @type {self.BuildSnapshotCreator['load']} */
async function load(config) {
	const data = await loadData(config);

	if (data === undefined) {
		throw new Error("error while loading build cache data");
	}

	return create(config, data);
}

/** @type {self.BuildSnapshotCreator['create']} */
function create(config, data) {
	const state = {
		/** @type {CacheEntry[]} */
		added: [],
		/** @type {CacheEntry[]} */
		evicted: [],
	};

	const keysInCurrent = new Set();
	for (const key in data.current) {
		keysInCurrent.add(key);
		if (data.current[key].age === "new") {
			state.added.push(data.current[key]);
		}
	}

	for (const key in data.previous) {
		if (!keysInCurrent.has(key)) {
			state.evicted.push(data.previous[key]);
		}
	}

	return {
		get evicted() {
			return state.evicted;
		},

		get added() {
			return state.added;
		},

		get current() {
			return Object.values(data.current);
		},

		async getBody(entry) {
			if (entry.file === undefined) {
				return undefined;
			}
			const bodyPath = path.resolve(config.dir, entry.file);
			return await fs.readTextFile(bodyPath);
		},
	};
}
