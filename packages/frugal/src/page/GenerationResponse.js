import * as webStream from "node:stream/web";
import * as pageResponse from "../page/PageResponse.js";
import * as hash from "../utils/hash.js";
import * as jsonValue from "../utils/jsonValue.js";
import * as readableStream from "../utils/readableStream.js";
import * as _type from "./_type/GenerationResponse.js";

/**  @typedef {_type.SerializedGenerationResponse} SerializedGenerationResponse */

/** @template {jsonValue.JsonValue} [DATA=jsonValue.JsonValue] */
export class LiveGenerationResponse {
	/** @type {pageResponse.PageResponse<DATA>} */
	#pageResponse;
	/** @type {_type.Init<DATA>} */
	#init;
	/** @type {string | undefined} */
	#hash;
	/** @type {string | webStream.ReadableStream<string> | undefined} */
	#body;
	/** @type {_type.SerializedGenerationResponse | undefined} */
	#serialized;

	/**
	 * @param {pageResponse.PageResponse<DATA>} pageResponse
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

	get body() {
		if (this.#body === undefined) {
			this.#body =
				this.#pageResponse.type === "data"
					? this.#init.render(this.#pageResponse.data)
					: undefined;
		}
		return this.#body;
	}

	get headers() {
		return this.#pageResponse.headers;
	}

	get status() {
		return this.#pageResponse.status;
	}

	async serialize() {
		if (this.#serialized === undefined) {
			const bodyString =
				this.body instanceof webStream.ReadableStream
					? await readableStream.readStringStream(this.body)
					: this.body;

			this.#serialized = {
				path: this.#init.path,
				hash: this.hash,
				body: bodyString,
				headers: Array.from(this.headers.entries()),
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
}

/**
 * @param {LiveGenerationResponse<jsonValue.JsonValue>|_type.SerializedGenerationResponse} response
 * @returns {Response}
 */
export function toResponse(response) {
	const headers = new Headers(response.headers);
	const body = response.body;

	if (!headers.has("content-type")) {
		headers.set("Content-Type", "text/html; charset=utf-8");
	}

	if (!headers.has("etag") && typeof body === "string") {
		headers.set("Etag", `W/"${hash.create().update(body).digest()}"`);
	}

	return new Response(
		typeof body === "string"
			? body
			: body === undefined
			  ? undefined
			  : readableStream.toReadableStream(body),
		{
			headers,
			status: response.status,
		},
	);
}
