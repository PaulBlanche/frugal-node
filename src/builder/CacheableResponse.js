import * as response from "../page/Response.js";
import * as hash from "../utils/hash.js";
import * as jsonValue from "../utils/jsonValue.js";
import * as webstream from "../utils/webstream.js";
import * as _type from "./_type/CacheableResponse.js";

/** @typedef {_type.SerializedCacheableResponse} SerializedCacheableResponse */

/** @template {jsonValue.JsonValue} DATA */
export class CacheableResponse {
	/** @type {response.PageResponse<DATA>} */
	#pageResponse;
	/** @type {_type.Init<DATA>} */
	#init;
	/** @type {string | undefined} */
	#hash;
	/** @type {string | webstream.ReadableStream<string> | undefined} */
	#body;
	/** @type {_type.SerializedCacheableResponse | undefined} */
	#serialized;

	/**
	 * @param {response.PageResponse<DATA>} pageResponse
	 * @param {_type.Init<DATA>} init
	 */
	constructor(pageResponse, init) {
		this.#init = init;
		this.#pageResponse = pageResponse;
	}

	get path() {
		return this.#init.path;
	}

	get hash() {
		if (this.#hash === undefined) {
			this.#hash = this.#computeHash();
		}
		return this.#hash;
	}

	#render() {
		if (this.#body === undefined) {
			this.#body =
				this.#pageResponse.type === "data"
					? this.#init.render(this.#pageResponse.data)
					: undefined;
		}
		return this.#body;
	}

	async serialize() {
		if (this.#serialized === undefined) {
			const body = this.#render();
			const bodyString =
				body instanceof webstream.ReadableStream ? await webstream.readStream(body) : body;

			this.#serialized = {
				path: this.#init.path,
				hash: this.hash,
				body: bodyString,
				headers: Array.from(this.#pageResponse.headers.entries()),
				status: this.#pageResponse.status,
			};
		}

		return this.#serialized;
	}

	#computeHash() {
		return hash
			.create()
			.update(this.#pageResponse.dataHash)
			.update(this.#init.path)
			.update(this.#init.moduleHash)
			.update(this.#init.configHash)
			.digest();
	}

	toResponse() {
		const headers = new Headers(this.#pageResponse.headers);
		const body = this.#render();

		if (!headers.has("content-type")) {
			headers.set("Content-Type", "text/html; charset=utf-8");
		}

		if (!headers.has("etag") && typeof body === "string") {
			headers.set("Etag", `W/"${hash.create().update(body).digest()}"`);
		}

		// type mismatch betwwen `Response` expecting a `ReadableStream` and
		// body being a `webstream.ReadableStream`. We need body as a
		// `webstream.ReadableStream` because it is typed as async iterable
		// whereas `ReadableStream` is not typed as such.
		//
		// ultimately this should run on node (or node compatible runtime) so
		// both types should point to the same implementation that should be
		// async iterable
		return new Response(/** @type {any} */ (body), {
			headers,
			status: this.#pageResponse.status,
		});
	}
}
