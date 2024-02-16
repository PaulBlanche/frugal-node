import * as generationResponse from "../../page/GenerationResponse.js";
import * as cache from "./Cache.js";

/**
 * @implements {cache.CacheStorage}
 */
export class MemoryStorage {
	/** @type {Map<string, generationResponse.SerializedGenerationResponse>} */
	#store;

	constructor() {
		this.#store = new Map();
	}

	/**
	 * @param {string} path
	 * @param {generationResponse.SerializedGenerationResponse} response
	 * @returns {void}
	 */
	set(path, response) {
		this.#store.set(path, response);
	}

	/**
	 * @param {string} path
	 * @returns {generationResponse.SerializedGenerationResponse|undefined}
	 */
	get(path) {
		return this.#store.get(path);
	}

	/**
	 * @param {string} path
	 * @returns {void}
	 */
	delete(path) {
		this.#store.delete(path);
	}
}
