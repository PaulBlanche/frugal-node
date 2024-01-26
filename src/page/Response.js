import * as cookies from "../utils/cookies.js";
import * as jsonValue from "../utils/jsonValue.js";
import * as _type from "./_type/Response.js";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

class BaseResponse {
	/** @type {Headers} */
	#headers;
	/** @type {_type.ResponseInit} */
	#init;

	/** @param {_type.ResponseInit} [init] */
	constructor(init = {}) {
		this.#init = init;
		this.#headers = new Headers(this.#init.headers);

		if (this.#init.forceDynamic) {
			cookies.setCookie(this.#headers, {
				httpOnly: true,
				name: FORCE_GENERATE_COOKIE,
				value: "true",
			});
		}
	}

	get headers() {
		return this.#headers;
	}

	get status() {
		return this.#init.status ?? 200;
	}
}

/** @template {jsonValue.JsonValue} DATA */
export class DataResponse extends BaseResponse {
	/** @type {DATA} */
	#data;

	/**
	 * @param {DATA} data
	 * @param {_type.ResponseInit} [init]
	 */
	constructor(data, init) {
		super(init);
		this.#data = data;
	}

	/** @returns {"data"} */
	get type() {
		return "data";
	}

	get data() {
		return this.#data;
	}

	get dataHash() {
		return JSON.stringify(jsonValue.hashableJsonValue(this.#data)) ?? "";
	}
}

export class EmptyResponse extends BaseResponse {
	/** @returns {"empty"} */
	get type() {
		return "empty";
	}

	/** @returns {void} */
	get data() {
		return undefined;
	}

	get dataHash() {
		return "__empty__";
	}
}

/**
 * @template {jsonValue.JsonValue} DATA
 * @typedef {EmptyResponse | DataResponse<DATA>} PageResponse<DATA>
 */
