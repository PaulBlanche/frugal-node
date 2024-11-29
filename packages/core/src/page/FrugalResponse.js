/** @import * as self from "./FrugalResponse.js" */

import { Hash } from "../utils/Hash.js";
import * as cookies from "../utils/cookies.js";
import { token } from "../utils/crypto.js";

export const FORCE_GENERATE_COOKIE = "__frugal_force_generate";

/** @type {self.FrugalResponseCreator} */
export const FrugalResponse = {
	create,
};

/** @type {self.FrugalResponseCreator['create']} */
async function create(response, init) {
	const state = {
		/** @type {string|undefined} */
		hash: undefined,
		/** @type {string  | undefined} */
		body: undefined,
		/** @type {self.SerializedFrugalResponse | undefined} */
		serialized: undefined,
	};

	const headers = new Headers(response.headers);

	const generationDate = new Date().toUTCString();
	headers.set("X-Frugal-Generation-Date", generationDate);
	if (headers.get("Last-Modified") === null) {
		headers.set("Last-Modified", generationDate);
	}
	headers.set("x-frugal-build-hash", _hash());

	const cryptoKey = await init.cryptoKey;
	if (response.forceDynamic === true && cryptoKey !== undefined) {
		cookies.setCookie(headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: await token(cryptoKey, { op: "fg" }),
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

		serialize,
	};

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

	function serialize() {
		if (state.serialized === undefined) {
			state.serialized = {
				path: init.path,
				hash: _hash(),
				body: _body(),
				headers: Array.from(headers.entries()),
				status: response.status,
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

	return new Response(body, {
		headers,
		status: response.status,
	});
}
