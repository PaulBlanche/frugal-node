import * as pageDescriptor from "../../page/PageDescriptor.js";
import * as sessionStorage from "./sessionStorage.js";

/**
 * @implements {pageDescriptor.Session}
 */
export class Session {
	/** @type {Map<string, any>} */
	#data;
	/** @type {string|undefined} */
	#id;
	/** @type {boolean} */
	#shouldBePersisted;

	/**
	 *
	 * @param {sessionStorage.SessionData} [data]
	 * @param {string} [id]
	 */
	constructor(data = {}, id = undefined) {
		this.#id = id;
		this.#data = new Map(Object.entries(data));
		this.#shouldBePersisted = false;
	}

	get _id() {
		return this.#id;
	}

	get _data() {
		return Object.fromEntries(this.#data);
	}

	get _shouldBePersisted() {
		return this.#shouldBePersisted;
	}

	persist() {
		this.#shouldBePersisted = true;
	}

	/**
	 * @template [T = unknown]
	 * @param {string} key
	 * @returns {T | undefined}
	 */
	get(key) {
		return this.#data.get(key);
	}

	/**
	 * @template [T = unknown]
	 * @param {string} key
	 * @param {T} value
	 * @returns {void}
	 */
	set(key, value) {
		this.#data.set(key, value);
	}

	/**
	 * @param {string} key
	 * @returns {void}
	 */
	delete(key) {
		this.#data.delete(key);
	}

	/**
	 *
	 * @param {string} key
	 * @returns {boolean}
	 */
	has(key) {
		return this.#data.has(key);
	}
}
