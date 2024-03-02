import * as path from "node:path";
import { Hash } from "../utils/Hash.js";
import * as fs from "../utils/fs.js";
import { log } from "../utils/log.js";
import { Snapshot } from "./Snapshot.js";
import { loadCacheData } from "./loadCacheData.js";

/** @type {import('./BuildCache.ts').BuildCacheMaker} */
export const BuildCache = {
	create,
	load,
};

/** @type {import('./BuildCache.ts').BuildCacheMaker['load']} */
async function load(config) {
	const data = await loadCacheData(config);
	return create(config, data?.current);
}

/** @type {import('./BuildCache.ts').BuildCacheMaker['create']} */
function create(config, previous = {}) {
	const state = {
		/** @type {import('./loadCacheData.ts').BuildCacheData} */
		current: {},
		previous,
	};

	return {
		async add(response) {
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

			const serialized = await response.serialize();
			const name = Hash.create().update(response.path).digest();

			/** @type {import('./loadCacheData.ts').CacheEntry} */
			const entry = {
				...serialized,
				age: "new",
			};
			delete (/** @type {any} */ (entry).body);

			if (serialized.body) {
				const bodyPath = path.resolve(config.dir, `doc_${name}`);
				await fs.ensureFile(bodyPath);
				await fs.writeTextFile(bodyPath, serialized.body);
				entry.doc = name;
			}

			state.current[response.path] = entry;
		},

		async save() {
			const cachePath = path.resolve(config.dir, "cache.json");
			await fs.ensureFile(cachePath);
			await fs.writeTextFile(
				cachePath,
				JSON.stringify({ current: state.current, previous: state.previous }, undefined, 2),
			);

			const cacheSnapshot = await Snapshot.load(config);

			await Promise.all(
				cacheSnapshot.evicted.map(async (entry) => {
					if (entry.doc !== undefined) {
						const bodyPath = path.resolve(config.dir, `doc_${entry.doc}`);
						await fs.remove(bodyPath);
					}
				}),
			);
		},
	};
}
