import * as buildCache from "../builder/BuildCache.js";
import * as generationResponse from "../page/GenerationResponse.js";
import * as serverCache from "../server/cache/Cache.js";
import * as jsonValue from "../utils/jsonValue.js";

/**
 * @implements {buildCache.BuildCache}
 * @implements {serverCache.RuntimeCache}
 */
export class Cache {
	/** @type {Record<string, generationResponse.SerializedGenerationResponse>} */
	#data;

	constructor() {
		this.#data = {};
	}

	/**
	 * @template {jsonValue.JsonValue} DATA
	 * @param {generationResponse.LiveGenerationResponse<DATA>} response
	 */
	async add(response) {
		if (response.path in this.#data) {
			const previous = this.#data[response.path];
			if (previous.hash === response.hash) {
				return;
			}
		}

		this.#data[response.path] = await response.serialize();
	}

	/**
	 * @param {string} key
	 * @returns {Promise<boolean>}
	 */
	async has(key) {
		const data = this.#data[key];
		if (data === undefined) {
			return false;
		}
		return true;
	}

	/**
	 * @param {string} key
	 * @returns {Promise<Response|undefined>}
	 */
	async get(key) {
		const data = await this.#data[key];
		if (data === undefined) {
			return undefined;
		}

		return generationResponse.toResponse(data);
	}

	save() {
		return Promise.resolve();
	}
}
