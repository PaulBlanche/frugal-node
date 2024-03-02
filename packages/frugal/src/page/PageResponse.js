import * as cookies from "../utils/cookies.js";
import * as jsonValue from "../utils/jsonValue.js";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

/** @type {import('./PageResponse.ts').Maker} */
export const PageResponse = {
	data: createDataResponse,
	empty: createEmptyResponse,
};

/** @type {import('./PageResponse.ts').Maker['empty']} */
function createEmptyResponse(init) {
	const baseResponse = createBaseResponse(init);

	return {
		...baseResponse,
		get type() {
			return /** @type {const} */ ("empty");
		},
		get data() {
			return undefined;
		},
		get dataHash() {
			return "__empty__";
		},
	};
}

/** @type {import('./PageResponse.ts').Maker['data']} */
function createDataResponse(data, init) {
	const baseResponse = createBaseResponse(init);

	return {
		...baseResponse,
		get type() {
			return /** @type {const} */ ("data");
		},
		get data() {
			return data;
		},
		get dataHash() {
			return JSON.stringify(jsonValue.hashableJsonValue(data)) ?? "";
		},
	};
}

/**
 * @param {import("./PageResponse.ts").ResponseInit} [init]
 * @returns {import("./PageResponse.ts").BaseResponse}
 */
function createBaseResponse(init = {}) {
	const headers = new Headers(init.headers);

	if (init.forceDynamic) {
		cookies.setCookie(headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: "true",
		});
	}

	return {
		get headers() {
			return headers;
		},
		get status() {
			return init.status ?? 200;
		},
	};
}
