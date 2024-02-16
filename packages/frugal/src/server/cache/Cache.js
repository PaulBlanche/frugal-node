import * as generationResponse from "../../page/GenerationResponse.js";
import * as _type from "./_type/Cache.js";

/** @typedef {_type.RuntimeCache} RuntimeCache */
/** @typedef {_type.CacheStorage} CacheStorage */

/** @implements {_type.RuntimeCache} */
export class Cache {
	/** @type {_type.CacheStorage} */
	#cacheStorage;

	/**
	 * @param {_type.CacheStorage} cacheStorage
	 */
	constructor(cacheStorage) {
		this.#cacheStorage = cacheStorage;
	}

	/**
	 * @param {generationResponse.LiveGenerationResponse} response
	 * @returns {Promise<void>}
	 */
	async add(response) {
		return this.#cacheStorage.set(response.path, await response.serialize());
	}

	/**
	 * @param {string} path
	 * @returns {Promise<boolean>}
	 */
	async has(path) {
		const data = await this.#cacheStorage.get(path);
		if (data === undefined) {
			return false;
		}
		return true;
	}

	/**
	 * @param {string} path
	 * @returns {Promise<Response|undefined>}
	 */
	async get(path) {
		const serializedCacheableResponse = await this.#cacheStorage.get(path);
		if (serializedCacheableResponse === undefined) {
			return undefined;
		}

		return generationResponse.toResponse(serializedCacheableResponse);
	}
}
