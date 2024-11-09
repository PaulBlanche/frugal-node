/** @import * as self from "./BuildCache.js" */

import * as path from "node:path";
import { BuildSnapshot } from "../exporter/BuildSnapshot.js";
import { Hash } from "../utils/Hash.js";
import * as fs from "../utils/fs.js";
import { log } from "../utils/log.js";

/** @type {self.loadData} */
export async function loadData(config) {
	try {
		const cachePath = path.resolve(config.dir, "cache.json");
		const data = await fs.readTextFile(cachePath);
		return JSON.parse(data);
	} catch {
		return undefined;
	}
}

/** @type {self.BuildCacheCreator} */
export const BuildCache = {
	load,
};

/** @type {self.BuildCacheCreator['load']} */
async function load(config) {
	const data = await loadData(config);

	const state = {
		/** @type {self.BuildCacheData} */
		current: {},
		/** @type {self.BuildCacheData} */
		previous: data?.current ?? {},
	};

	return {
		add,
		save,
	};

	/** @type {self.BuildCache['add']} */
	async function add(response) {
		log(`Add response for path "${response.path}" to build cache`, {
			scope: "BuildCache",
			level: "verbose",
		});

		if (response.path in state.previous) {
			const previousResponse = state.previous[response.path];
			if (previousResponse.hash === response.hash) {
				log(`Keep previous response for path "${response.path}" in build cache`, {
					scope: "BuildCache",
					level: "verbose",
				});

				state.current[response.path] = state.previous[response.path];
				state.current[response.path].age = "old";
				return;
			}
		}

		log(`Replace previous response for path "${response.path}" in build cache`, {
			scope: "BuildCache",
			level: "verbose",
		});

		const serialized = response.serialize();
		const file = `body_${Hash.create().update(response.path).digest()}`;

		/** @type {self.CacheEntry} */
		const entry = {
			...serialized,
			age: "new",
		};
		delete (/** @type {any} */ (entry).body);

		if (serialized.body) {
			const bodyPath = path.resolve(config.dir, file);
			await fs.ensureFile(bodyPath);
			await fs.writeTextFile(bodyPath, serialized.body);
			entry.file = file;
		}

		state.current[response.path] = entry;
	}

	/** @type {self.BuildCache['save']} */
	async function save() {
		const cachePath = path.resolve(config.dir, "cache.json");
		await fs.ensureFile(cachePath);
		await fs.writeTextFile(
			cachePath,
			JSON.stringify({ current: state.current, previous: state.previous }),
		);

		const snapshot = BuildSnapshot.create(config, {
			current: state.current,
			previous: state.previous,
		});

		await Promise.all(
			snapshot.evicted.map(async (entry) => {
				if (entry.file !== undefined) {
					const bodyPath = path.resolve(config.dir, entry.file);
					await fs.remove(bodyPath);
				}
			}),
		);
	}
}
