/** @import * as self from "./FrugalResponse.js" */

import { Hash } from "../utils/Hash.js";
import * as cookies from "../utils/cookies.js";
import { forceGenerateToken } from "../utils/crypto.js";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

/** @type {self.FrugalResponseCreator} */
export const FrugalResponse = {
	create,
	from,
};

/** @type {self.FrugalResponseCreator['from']} */
function from(serialized) {
	const headers = new Headers(serialized.headers);

	const state = {
		date: serialized.date,
	};

	return {
		get path() {
			return serialized.path;
		},

		get hash() {
			return serialized.hash;
		},

		get body() {
			return serialized.body;
		},

		get headers() {
			return headers;
		},

		get status() {
			return serialized.status;
		},

		get date() {
			return state.date;
		},

		get maxAge() {
			return serialized.maxAge;
		},

		setDateFrom(response) {
			state.date = response.date;
		},
		serialize() {
			return { ...serialized, headers: Array.from(headers.entries()) };
		},
	};
}

/** @type {self.FrugalResponseCreator['create']} */
async function create(response, init) {
	const state = {
		/** @type {string|undefined} */
		hash: undefined,
		/** @type {string  | undefined} */
		body: undefined,
		/** @type {self.SerializedFrugalResponse | undefined} */
		serialized: undefined,
		/** @type {string} */
		date: new Date().toUTCString(),
	};

	const headers = new Headers(response.headers);

	if (headers.get("Last-Modified") === null) {
		headers.set("Last-Modified", state.date);
	}

	const cryptoKey = await init.cryptoKey;
	if (response.forceDynamic === true && cryptoKey !== undefined) {
		cookies.setCookie(headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: await forceGenerateToken(cryptoKey),
		});
	}

	return {
		get path() {
			return init.path;
		},

		get hash() {
			return _hash();
		},

		get body() {
			return _body();
		},

		get headers() {
			return headers;
		},

		get status() {
			return response.status;
		},

		get date() {
			return state.date;
		},

		get maxAge() {
			return response.maxAge;
		},

		setDateFrom,
		serialize,
	};

	/** @type {self.FrugalResponse['setDateFrom']} */
	function setDateFrom(response) {
		state.date = response.date;
	}

	function _hash() {
		if (state.hash === undefined) {
			state.hash = Hash.create()
				.update(response.dataHash)
				.update(init.path)
				.update(init.moduleHash)
				.update(init.configHash)
				.digest();
		}

		return state.hash;
	}

	function _body() {
		if (state.body === undefined) {
			state.body = response.type === "data" ? init.render(response.data) : undefined;
		}
		return state.body;
	}

	/** @type {self.FrugalResponse['serialize']} */
	function serialize() {
		if (state.serialized === undefined) {
			state.serialized = {
				path: init.path,
				hash: _hash(),
				body: _body(),
				headers: Array.from(headers.entries()),
				status: response.status,
				date: state.date,
				maxAge: response.maxAge,
			};
		}

		return state.serialized;
	}
}

/**
 * @type {self.toResponse}
 */
export function toResponse(response) {
	const headers = new Headers(response.headers);
	const body = response.body;

	if (!headers.has("content-type")) {
		headers.set("Content-Type", "text/html; charset=utf-8");
	}

	if (!headers.has("etag") && typeof body === "string") {
		headers.set("Etag", `W/"${Hash.create().update(body).digest()}"`);
	}

	headers.set("X-Frugal-Generation-Date", response.date);
	return new Response(body, {
		headers,
		status: response.status,
	});
}
