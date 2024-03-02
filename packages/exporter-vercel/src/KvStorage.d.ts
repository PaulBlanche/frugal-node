import { kv } from "@vercel/kv";
import { } from "frugal-node/exporter";

export interface KvStorage extends CacheSto

/**
 * @implements {exporter.CacheStorage}
 */
export class KvStorage {
	/**
	 * @param {string} path
	 * @param {exporter.SerializedGenerationResponse} response
	 * @returns {Promise<void>}
	 */
	async set(path, response) {
		await kv.set(path, response);
	}

	/**
	 * @param {string} path
	 * @returns {Promise<exporter.SerializedGenerationResponse|undefined>}
	 */
	async get(path) {
		/** @type {exporter.SerializedGenerationResponse|null} */
		const data = await kv.get(path);
		if (data === null) {
			return undefined;
		}
		return data;
	}

	/**
	 * @param {string} path
	 * @returns {Promise<void>}
	 */
	async delete(path) {
		await kv.del(path);
	}
}
