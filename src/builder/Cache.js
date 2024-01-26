import * as fs from "../utils/fs.js";
import * as hash from "../utils/hash.js";
import * as jsonValue from "../utils/jsonValue.js";
import { log } from "../utils/log.js";
import * as path from "../utils/path.js";
import { CacheableResponse } from "./CacheableResponse.js";
import * as _type from "./_type/Cache.js";

class Cache {
	/** @type {_type.CacheConfig} */
	#config;
	/** @type {_type.Data} */
	#previous;
	/** @type {_type.Data} */
	#current;

	/**
	 * @param {_type.CacheConfig} config
	 * @param {_type.Data} previous
	 */
	constructor(config, previous = {}) {
		this.#config = config;
		this.#previous = previous;
		this.#current = {};
	}

	/**
	 * @template {jsonValue.JsonValue} DATA
	 * @param {CacheableResponse<DATA>} response
	 */
	async add(response) {
		log(`Add response for path "${response.path}" to build cache`, {
			scope: "BuildCache",
			level: "verbose",
		});

		if (response.path in this.#previous) {
			const previousResponse = this.#previous[response.path];
			if (previousResponse.hash === response.hash) {
				log(`Keep previous response for path "${response.path}" in build cache`, {
					scope: "BuildCache",
					level: "verbose",
				});

				this.#current[response.path] = this.#previous[response.path];
				this.#current[response.path].age = "old";
				return;
			}
		}

		log(`Replace previous response for path "${response.path}" in build cache`, {
			scope: "BuildCache",
			level: "verbose",
		});

		const serialized = await response.serialize();
		const name = hash.create().update(response.path).digest();

		/** @type {_type.SnapshotEntry} */
		const entry = {
			...serialized,
			age: "new",
		};
		delete (/** @type {any} */ (entry).body);

		if (serialized.body) {
			const bodyPath = path.resolve(this.#config.dir, `doc_${name}`);
			await fs.ensureFile(bodyPath);
			await fs.writeTextFile(bodyPath, serialized.body);
			entry.doc = name;
		}

		this.#current[response.path] = entry;
	}

	async save() {
		const cachePath = path.resolve(this.#config.dir, "cache.json");
		await fs.ensureFile(cachePath);
		await fs.writeTextFile(
			cachePath,
			JSON.stringify({ current: this.#current, previous: this.#previous }, undefined, 2),
		);

		const cacheSnapshot = await snapshot(this.#config);

		await Promise.all(
			cacheSnapshot.evicted.map(async (entry) => {
				if (entry.doc !== undefined) {
					const bodyPath = path.resolve(this.#config.dir, `doc_${entry.doc}`);
					await fs.remove(bodyPath);
				}
			}),
		);
	}
}

/**
 * @param {_type.CacheConfig} config
 * @returns {Promise<Cache>}
 */
export async function load(config) {
	const data = await loadCacheData(config);
	return new Cache(config, data?.current);
}

/** @typedef {_type.SerializedCache} SerializedCache */
/** @typedef {_type.Data} Data */

/**
 * @param {_type.CacheConfig} config
 * @returns {Promise<_type.SerializedCache | undefined>}
 */
export async function loadCacheData(config) {
	try {
		const cachePath = path.resolve(config.dir, "cache.json");
		const data = await fs.readTextFile(cachePath);
		return JSON.parse(data);
	} catch {
		return undefined;
	}
}

/** @typedef {_type.SnapshotEntry} SnapshotEntry */

export class CacheSnapshot {
	/** @type {_type.CacheConfig} */
	#config;
	/** @type {_type.SnapshotEntry[]} */
	#added;
	/** @type {_type.SnapshotEntry[]} */
	#evicted;
	/** @type {_type.SnapshotEntry[]} */
	#current;

	/**
	 * @param {_type.CacheConfig} config
	 * @param {_type.SerializedCache} data
	 */
	constructor(config, { current, previous }) {
		this.#current = Object.values(current);
		this.#added = [];
		this.#evicted = [];
		this.#config = config;

		const keysInCurrent = new Set();
		for (const key in current) {
			keysInCurrent.add(key);
			if (current[key].age === "new") {
				this.#added.push(current[key]);
			}
		}

		for (const key in previous) {
			if (!keysInCurrent.has(key)) {
				this.#evicted.push(previous[key]);
			}
		}
	}

	/** @param {_type.SnapshotEntry} entry */
	async read(entry) {
		if (entry.doc === undefined) {
			return undefined;
		}
		const bodyPath = path.resolve(this.#config.dir, `doc_${entry.doc}`);
		return fs.readTextFile(bodyPath);
	}

	get evicted() {
		return this.#evicted;
	}

	get added() {
		return this.#added;
	}

	get current() {
		return this.#current;
	}
}

/**
 * @param {_type.CacheConfig} config
 * @returns {Promise<CacheSnapshot>}
 */
export async function snapshot(config) {
	const data = await loadCacheData(config);
	if (data === undefined) {
		throw Error("error while loading build cache data");
	}
	return new CacheSnapshot(config, data);
}
