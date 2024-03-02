import * as webStream from "node:stream/web";
import { Hash } from "../utils/Hash.js";
import * as readableStream from "../utils/readableStream.js";

/** @type {import('./GenerationResponse.ts').GenerationResponseMaker} */
export const GenerationResponse = {
	create,
};

/** @type {import('./GenerationResponse.ts').GenerationResponseMaker['create']} */
export function create(response, init) {
	const state = {
		/** @type {string|undefined} */
		hash: undefined,
		/** @type {string | webStream.ReadableStream<string> | undefined} */
		body: undefined,
		/** @type {import('./GenerationResponse.ts').SerializedGenerationResponse | undefined} */
		serialized: undefined,
	};

	return {
		get path() {
			return init.path;
		},

		get hash() {
			if (state.hash === undefined) {
				state.hash = Hash.create()
					.update(response.dataHash)
					.update(init.path)
					.update(init.moduleHash)
					.update(init.configHash)
					.digest();
			}
			return state.hash;
		},

		get body() {
			if (state.body === undefined) {
				state.body = response.type === "data" ? init.render(response.data) : undefined;
			}
			return state.body;
		},

		get headers() {
			return response.headers;
		},

		get status() {
			return response.status;
		},

		async serialize() {
			if (state.serialized === undefined) {
				const bodyString =
					this.body instanceof webStream.ReadableStream
						? await readableStream.readStringStream(this.body)
						: this.body;

				state.serialized = {
					path: this.path,
					hash: this.hash,
					body: bodyString,
					headers: Array.from(this.headers.entries()),
					status: this.status,
				};
			}

			return state.serialized;
		},
	};
}

/**
 * @type {import('./GenerationResponse.ts').toResponse}
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
