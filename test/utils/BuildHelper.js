import * as assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import * as frugal from "../../index.js";
import { FrugalConfig } from "../../src/Config.js";
import * as cache from "../../src/builder/Cache.js";
import { loadManifest } from "../../src/builder/Manifest.js";
import * as assets from "../../src/page/Assets.js";

export class BuildHelper {
	/** @type {FrugalConfig} */
	#config;

	/** @param {frugal.Config} config */
	constructor(config) {
		this.#config = new FrugalConfig(config);
	}

	/** @param {Partial<frugal.Config>} [config] */
	async build(config) {
		return frugal.build({ ...this.#config._config, ...config });
	}

	get config() {
		return this.#config;
	}

	getCache() {
		return CacheExplorer.load(this.#config);
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<assets.PageAssets>}
	 */
	async getAssets(entrypoint) {
		const manifest = await loadManifest(this.#config);
		return new assets.PageAssets(manifest.assets, entrypoint);
	}
}

class CacheExplorer {
	/** @type {FrugalConfig} */
	#config;
	/** @type {cache.Data} */
	#data;

	/** @param {FrugalConfig} config */
	static async load(config) {
		const data = await cache.loadCacheData({ dir: config.buildCacheDir });
		if (data === undefined) {
			throw Error("error while loading cache data");
		}
		return new CacheExplorer(config, data.current);
	}

	/**
	 * @param {FrugalConfig} config
	 * @param {cache.Data} data
	 */
	constructor(config, data) {
		this.#config = config;
		this.#data = data;
	}

	/**
	 * @param {string} pagePath
	 * @returns {Promise<string | undefined>}
	 */
	async #loadDocument(pagePath) {
		const docName = this.#data[pagePath].doc;
		if (docName === undefined) {
			return undefined;
		}
		return await fs.promises.readFile(path.join(this.#config.buildCacheDir, `doc_${docName}`), {
			encoding: "utf-8",
		});
	}

	/**
	 * @returns {Promise<
	 *     [string, Omit<cache.Data[string] & { body?: string }, "doc" | "hash">][]
	 * >}
	 */
	async #entries() {
		return await Promise.all(
			Object.entries(this.#data)
				.sort((a, b) => a[0].localeCompare(b[0]))
				.map(async ([path, entry]) => {
					return [
						path,
						{
							age: entry.age,
							path: entry.path,
							body: await this.#loadDocument(path),
							headers: entry.headers,
							status: entry.status,
						},
					];
				}),
		);
	}

	/**
	 * @param {Record<string, Omit<cache.Data[string] & { body?: string }, "doc" | "hash">>} expected
	 * @param {string | Error} [message]
	 */
	async assertContent(expected, message) {
		const actual = await this.#entries();
		assert.deepStrictEqual(actual, Object.entries(expected), message);
	}

	/**
	 * @param {string} path
	 * @param {"new" | "old"} expected
	 * @param {string | Error} [message]
	 */
	async assertPathAge(path, expected, message) {
		assert.strictEqual(this.#data[path]?.age, expected, message);
	}

	/**
	 * @param {string} path
	 * @returns {Promise<Omit<cache.Data[string] & { body?: string }, "doc" | "hash">>}
	 */
	async get(path) {
		return Object.fromEntries(await this.#entries())[path];
	}
}
