import * as path from "node:path";
import * as fs from "../utils/fs.js";
import { loadCacheData } from "./loadCacheData.js";

/** @type {import('./Snapshot.ts').SnapshotMaker} */
export const Snapshot = {
	create,
	load,
};

/** @type {import('./Snapshot.ts').SnapshotMaker["create"]} */
function create(config, { current, previous }) {
	const state = {
		/** @type {import("./loadCacheData.ts").CacheEntry[]} */
		added: [],
		/** @type {import('./loadCacheData.ts').CacheEntry[]} */
		evicted: [],
	};

	const keysInCurrent = new Set();
	for (const key in current) {
		keysInCurrent.add(key);
		if (current[key].age === "new") {
			state.added.push(current[key]);
		}
	}

	for (const key in previous) {
		if (!keysInCurrent.has(key)) {
			state.evicted.push(previous[key]);
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
			return Object.values(current);
		},

		async read(entry) {
			if (entry.doc === undefined) {
				return undefined;
			}
			const bodyPath = path.resolve(config.dir, `doc_${entry.doc}`);
			return fs.readTextFile(bodyPath);
		},
	};
}

/** @type {import('./Snapshot.ts').SnapshotMaker["load"]} */
async function load(config) {
	const data = await loadCacheData(config);
	if (data === undefined) {
		throw Error("error while loading build cache data");
	}
	return create(config, data);
}
