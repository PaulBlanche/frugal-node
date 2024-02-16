import * as sessionStorage from "./sessionStorage.js";

/**
 * @implements {sessionStorage.SessionStorage}
 */
export class MemorySessionStorage {
	/** @type {Map<string, { data: sessionStorage.SessionData; expires: number | undefined }>} */
	#store;

	constructor() {
		this.#store = new Map();
	}

	/**
	 * @param {Headers} _headers
	 * @param {sessionStorage.SessionData} data
	 * @param {number | undefined} expires
	 * @returns {string}
	 */
	create(_headers, data, expires) {
		const id = crypto.randomUUID();

		this.#store.set(id, { data, expires });

		return id;
	}

	/**
	 * @param {Headers} _headers
	 * @param {string} id
	 * @returns {sessionStorage.SessionData | undefined}
	 */
	get(_headers, id) {
		const stored = this.#store.get(id);

		if (stored === undefined) {
			return undefined;
		}

		if (stored.expires && stored.expires < Date.now()) {
			this.#store.delete(id);
			return undefined;
		}

		return stored.data;
	}

	/**
	 * @param {Headers} _headers
	 * @param {string} id
	 * @param {sessionStorage.SessionData} data
	 * @param {number|undefined} [expires]
	 */
	update(_headers, id, data, expires) {
		this.#store.set(id, { data, expires });
	}

	/**
	 * @param {Headers} _headers
	 * @param {string} id
	 */
	delete(_headers, id) {
		this.#store.delete(id);
	}
}
