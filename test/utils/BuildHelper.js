import * as assert from "node:assert/strict";
import * as child_process from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as url from "node:url";
import * as frugal from "../../packages/frugal/exports/index.js";
import { FrugalConfig } from "../../packages/frugal/src/Config.js";
import { Snapshot } from "../../packages/frugal/src/builder/Snapshot.js";
import { loadCacheData } from "../../packages/frugal/src/builder/loadCacheData.js";
import { loadManifest } from "../../packages/frugal/src/builder/manifest.js";
import { Assets } from "../../packages/frugal/src/page/Assets.js";
import { Server } from "../../packages/frugal/src/server/Server.js";
import { ServerCache } from "../../packages/frugal/src/server/ServerCache.js";
import { loadFixtureBuildConfig, loadFixtureConfig, setupFixtures } from "./fixtures.js";

/** @typedef {{ global: import("../../packages/frugal/src/Config.js").Config, build: import("../../packages/frugal/src/BuildConfig.js").BuildConfig}} HelperConfig */
/**
 * @template T
 * @typedef {{ [P in keyof T]?: T[P] extends Record<string, unknown> ? DeepPartial<T[P]> : T[P] }} DeepPartial */

export class BuildHelper {
	/** @type {HelperConfig} */
	#config;
	/** @type {FrugalConfig} */
	#frugalConfig;
	/**@type {WatchHelper} */
	#watcher;

	/**
	 * @param {string} dirname
	 */
	static async setup(dirname) {
		await setupFixtures(dirname);
		const config = await loadFixtureConfig(dirname);
		const buildConfig = await loadFixtureBuildConfig(dirname);
		return new BuildHelper(config, buildConfig, new WatchHelper(dirname));
	}

	/**
	 * @param {import("../../packages/frugal/src/Config.js").Config} config
	 * @param {import("../../packages/frugal/src/BuildConfig.js").BuildConfig} buildConfig
	 * @param {WatchHelper} watcher
	 */
	constructor(config, buildConfig, watcher) {
		this.#config = { global: config, build: buildConfig };
		this.#frugalConfig = FrugalConfig.create(config);
		this.#watcher = watcher;
	}

	async build() {
		return frugal.build(this.#config.global, this.#config.build);
	}

	async context() {
		return frugal.context(this.#config.global, this.#config.build);
	}

	/** @param {DeepPartial<HelperConfig> | ((config: HelperConfig) => DeepPartial<HelperConfig>)} [config] */
	extends(config) {
		/** @type {HelperConfig} */
		const extended = merge(
			this.#config,
			typeof config === "function" ? config(this.#config) : config,
		);
		return new BuildHelper(extended.global, extended.build, this.#watcher);
	}

	get watcher() {
		return this.#watcher;
	}

	get config() {
		return this.#frugalConfig;
	}

	getCache() {
		return CacheExplorer.load(this.#frugalConfig);
	}

	getManifest() {
		return loadManifest(this.#frugalConfig);
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<Assets>}
	 */
	async getAssets(entrypoint) {
		const manifest = await this.getManifest();
		return Assets.create(manifest.assets, entrypoint);
	}

	/**
	 * @param {() => Promise<void>|void} callback
	 */
	async withServer(callback) {
		const buildSnapshot = await Snapshot.load({ dir: this.#frugalConfig.buildCacheDir });

		const memory = await buildSnapshot.current.reduce(
			async (memoryPromise, entry) => {
				const memory = await memoryPromise;
				memory[entry.path] = {
					path: entry.path,
					body: await buildSnapshot.read(entry),
					hash: entry.hash,
					headers: entry.headers,
					status: entry.status,
				};
				return memory;
			},
			Promise.resolve(
				/** @type {Record<string, import("../../packages/frugal/src/page/GenerationResponse.js").SerializedGenerationResponse>} */ ({}),
			),
		);

		/** @type {import("../../packages/frugal/src/server/ServerCache.js").CacheStorage} */
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
		const server = await Server.create({
			config: this.#frugalConfig,
			watch: false,
			manifest,
			cache: ServerCache.create(cacheStorage),
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

class WatchHelper {
	/** @type {child_process.ChildProcessWithoutNullStreams|undefined} */
	#process;
	/** @type {string} */
	#dirname;

	/** @param {string} dirname  */
	constructor(dirname) {
		this.#dirname = dirname;
	}

	watch() {
		this.#process = child_process.spawn(
			process.execPath,
			[path.resolve(this.#dirname, "project/watch.js")],
			{
				stdio: "pipe",
			},
		);

		/*this.#process.stderr.on("data", (chunk) => {
			console.log(new TextDecoder().decode(chunk).trim());
		});
		this.#process.stdout.on("data", (chunk) => {
			console.log(new TextDecoder().decode(chunk).trim());
		});*/
	}

	async awaitNextBuild() {
		return new Promise((res) => {
			/** @type {(chunk: any) => void} */
			const listener = (chunk) => {
				const messageLines = new TextDecoder().decode(chunk).split("\n");
				if (messageLines.includes("build:end")) {
					res(undefined);
					this.#process?.stdout.removeListener("data", listener);
				}
			};
			this.#process?.stdout.addListener("data", listener);
		});
	}

	kill() {
		if (this.#process) {
			this.#process.kill("SIGINT");
		}
	}
}

class CacheExplorer {
	/** @type {FrugalConfig} */
	#config;
	/** @type {import("../../packages/frugal/src/builder/loadCacheData.js").BuildCacheData} */
	#data;

	/** @param {FrugalConfig} config */
	static async load(config) {
		const data = await loadCacheData({ dir: config.buildCacheDir });
		if (data === undefined) {
			throw Error("error while loading cache data");
		}
		return new CacheExplorer(config, data.current);
	}

	/**
	 * @param {FrugalConfig} config
	 * @param {import("../../packages/frugal/src/builder/loadCacheData.js").BuildCacheData} data
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
	 *     [string, Omit<import("../../packages/frugal/src/builder/loadCacheData.js").BuildCacheData[string] & { body?: string }, "doc" | "hash">][]
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
	 * @param {Record<string, Omit<import("../../packages/frugal/src/builder/loadCacheData.js").BuildCacheData[string] & { body?: string }, "doc" | "hash">>} expected
	 * @param {string | Error} [message]
	 */
	async assertContent(expected, message) {
		const actual = await this.#entries();
		assert.deepStrictEqual(
			actual.map(([key, value]) => [
				key,
				{
					...value,
					headers: value.headers.filter(
						([key, value]) =>
							!["last-modified", "x-frugal-generation-date"].includes(key),
					),
				},
			]),
			Object.entries(expected),
			message,
		);
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
	 * @returns {Promise<Omit<import("../../packages/frugal/src/builder/loadCacheData.js").BuildCacheData[string] & { body?: string }, "doc" | "hash">>}
	 */
	async get(path) {
		return Object.fromEntries(await this.#entries())[path];
	}
}

/**
 *
 * @param {HelperConfig} config
 * @param {DeepPartial<HelperConfig>} [extend]
 * @returns {HelperConfig}
 */
function merge(config, extend) {
	return {
		global: {
			...config.global,
			...extend?.global,
		},
		build: {
			...config.build,
			...extend?.build,
		},
	};
}
