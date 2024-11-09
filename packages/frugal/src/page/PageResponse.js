/** @import * as self from "./PageResponse.js" */

import { Hash } from "../utils/Hash.js";
import * as cookies from "../utils/cookies.js";
import * as pageData from "../utils/serverData.js";

/** @type {self.PageResponseCreator} */
export const PageResponse = {
	data,
	empty,
};

/** @type {self.PageResponseCreator['data']} */
function data(data, init) {
	const baseResponse = _base(init);

	return {
		...baseResponse,
		get type() {
			return /** @type {const} */ ("data");
		},
		get data() {
			return data;
		},
		get dataHash() {
			const hash = Hash.create();

			hash.update("header");
			for (const [key, value] of baseResponse.headers) {
				hash.update(key);
				hash.update(value);
			}

			hash.update("status");
			hash.update(String(baseResponse.status));

			hash.update(pageData.hash(data));

			return hash.digest();
		},
	};
}

/** @type {self.PageResponseCreator['empty']} */
function empty(init) {
	const baseResponse = _base(init);

	return {
		...baseResponse,
		get type() {
			return /** @type {const} */ ("empty");
		},
		get data() {
			return undefined;
		},
		get dataHash() {
			const hash = Hash.create();

			hash.update("header");
			for (const [key, value] of baseResponse.headers) {
				hash.update(key);
				hash.update(value);
			}

			hash.update("status");
			hash.update(String(baseResponse.status));

			return hash.digest();
		},
	};
}

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

/**
 *
 * @param {self.ResponseInit} [init]
 * @returns {self.BaseResponse}
 */
function _base(init = {}) {
	const headers = new Headers(init.headers);

	if (init.forceDynamic) {
		cookies.setCookie(headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: "true",
		});
	}

	const instance =
		/** @type {self.BaseResponse} */
		({
			get headers() {
				return headers;
			},
			get status() {
				return init.status ?? 200;
			},
		});

	return instance;
}

/** @type {self.isPageResponse} */
export function isPageResponse(response) {
	if (typeof response !== "object" || response === null) {
		return false;
	}

	return (
		"headers" in response &&
		response.headers instanceof Headers &&
		"status" in response &&
		typeof response.status === "number" &&
		"type" in response &&
		typeof response.type === "string" &&
		["data", "empty"].includes(response.type) &&
		"data" in response &&
		"dataHash" in response &&
		typeof response.dataHash === "string"
	);
}
