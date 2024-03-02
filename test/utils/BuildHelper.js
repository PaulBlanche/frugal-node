import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import * as frugal from "../../packages/frugal/exports/index.js";
import { FrugalConfig } from "../../packages/frugal/src/Config.js";
import * as buildCache from "../../packages/frugal/src/builder/Cache.js";
import { loadManifest } from "../../packages/frugal/src/builder/manifest.js";
import * as assets from "../../packages/frugal/src/page/Assets.js";
import { Server } from "../../packages/frugal/src/server/Server.js";
import * as serverCache from "../../packages/frugal/src/server/cache/Cache.js";
import { loadFixtureConfig, setupFixtures } from "./fixtures.js";

export class BuildHelper {
	/** @type {frugal.Config} */
	#config;
	/** @type {FrugalConfig} */
	#frugalConfig;

	/**
	 * @param {string} dirname
	 */
	static async setup(dirname) {
		await setupFixtures(dirname);
		const config = await loadFixtureConfig(dirname);
		return new BuildHelper(config);
	}

	/** @param {frugal.Config} conf */
	constructor(conf) {
		this.#config = conf;
		this.#frugalConfig = new FrugalConfig(conf);
	}

	async build() {
		return frugal.build(this.#config);
	}

	/** @param {Partial<frugal.Config> | ((config:frugal.Config) => frugal.Config)} [config] */
	extends(config) {
		if (typeof config === "function") {
			return new BuildHelper({ ...this.#config, ...config(this.#config) });
		}
		return new BuildHelper({ ...this.#config, ...config });
	}

	get config() {
		return this.#frugalConfig;
	}

	getCache() {
		return CacheExplorer.load(this.#frugalConfig);
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<assets.PageAssets>}
	 */
	async getAssets(entrypoint) {
		const manifest = await loadManifest(this.#frugalConfig);
		return new assets.PageAssets(manifest.assets, entrypoint);
	}

	/**
	 * @param {() => Promise<void>|void} callback
	 */
	async withServer(callback) {
		const buildSnapshot = await buildCache.snapshot({ dir: this.#frugalConfig.buildCacheDir });

		const memory = await buildSnapshot.current.reduce(
			async (memoryPromise, entry) => {
				const memory = await memoryPromise;
				memory[entry.path] = JSON.stringify({
					path: entry.path,
					body: await buildSnapshot.read(entry),
					hash: entry.hash,
					headers: entry.headers,
					status: entry.status,
				});
				return memory;
			},
			Promise.resolve(/** @type {Record<string, string>} */ ({})),
		);

		/** @type {serverCache.CacheStorage} */
		const cacheStorage = {
			get: (path) => {
				return memory[path];
			},
			set: (path, content) => {
				memory[path] = content;
			},
			delete: (path) => {
				delete memory[path];
			},
		};

		const manifest = await loadManifest(this.#frugalConfig);
		const server = new Server({
			config: this.#frugalConfig,
			watch: false,
			manifest,
			cache: new serverCache.Cache(cacheStorage),
		});

		const controller = new AbortController();
		try {
			await /** @type {Promise<void>} */ (
				new Promise((res) => {
					server.serve({
						signal: controller.signal,
						onListen: () => res(),
					});
				})
			);
			await callback();
		} finally {
			controller.abort();
		}
	}
}

class CacheExplorer {
	/** @type {FrugalConfig} */
	#config;
	/** @type {buildCache.Data} */
	#data;

	/** @param {FrugalConfig} config */
	static async load(config) {
		const data = await buildCache.loadCacheData({ dir: config.buildCacheDir });
		if (data === undefined) {
			throw Error("error while loading cache data");
		}
		return new CacheExplorer(config, data.current);
	}

	/**
	 * @param {FrugalConfig} config
	 * @param {buildCache.Data} data
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
	 *     [string, Omit<buildCache.Data[string] & { body?: string }, "doc" | "hash">][]
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
	 * @param {Record<string, Omit<buildCache.Data[string] & { body?: string }, "doc" | "hash">>} expected
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
	 * @returns {Promise<Omit<buildCache.Data[string] & { body?: string }, "doc" | "hash">>}
	 */
	async get(path) {
		return Object.fromEntries(await this.#entries())[path];
	}
}
