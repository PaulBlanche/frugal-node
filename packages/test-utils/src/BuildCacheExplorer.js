/** @import { InternalBuildConfig } from "../../core/src/BuildConfig.js"; */
/** @import { BuildCacheData } from "../../core/src/build/BuildCache.js"; */
/** @import {SerializedFrugalResponse } from "../../core/src/page/FrugalResponse.js" */

import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { loadData } from "../../core/src/build/BuildCache.js";

export class BuildCacheExplorer {
	/** @type {InternalBuildConfig} */
	#config;
	/** @type {BuildCacheData} */
	#data;

	/** @param {InternalBuildConfig} config */
	static async load(config) {
		const data = await loadData({ dir: config.buildCacheDir });
		if (data === undefined) {
			throw Error("error while loading cache data");
		}
		return new BuildCacheExplorer(config, data.current);
	}

	/**
	 * @param {InternalBuildConfig} config
	 * @param {BuildCacheData} data
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
		const file = this.#data[pagePath].file;
		if (file === undefined) {
			return undefined;
		}
		return await fs.promises.readFile(path.join(this.#config.buildCacheDir, file), {
			encoding: "utf-8",
		});
	}

	/**
	 * @returns {Promise<
	 *     [string, Omit<SerializedFrugalResponse,"hash">][]
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
	 * @param {Record<string, Omit<SerializedFrugalResponse,"hash">>} expected
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
	assertPathAge(path, expected, message) {
		assert.strictEqual(this.#data[path]?.age, expected, message);
	}

	/**
	 * @param {string} path
	 * @returns {Promise<Omit<SerializedFrugalResponse,"hash">>}
	 */
	async get(path) {
		return Object.fromEntries(await this.#entries())[path];
	}
}
