import * as webstream from "node:stream/web";
import { Deferred } from "./Deferred.js";

/** @type {import('./readableStream.js').toReadableStream} */
export function toReadableStream(stream) {
	// handle type mismatch betwen `webstream.ReadableStream` expecting a
	// `ReadableStream`. The latter is the standard `ReadableStream` that is
	// used by all web-plateform apis (`Request`, `Response`, etc ...) that is
	// not typed as `AsyncIterable` (because of lacking browser implementation,
	// see https://github.com/microsoft/TypeScript/issues/29867). The former is
	// an internale node implementation that is typed `AsyncIterable`. We need a
	// readable stream that is async iterable so we use
	// `webstream.ReadableStream`, and this function simply cast it to
	// `ReadableStream` (they are both the same implementation on node side), so
	// it can be used with web-plateform apis.

	return /** @type {any} */ (stream);
}

/** @type {import('./readableStream.js').fromReadableStream} */
export function fromReadableStream(stream) {
	// handle type mismatch betwen `webstream.ReadableStream` expecting a
	// `ReadableStream`. The latter is the standard `ReadableStream` that is
	// used by all web-plateform apis (`Request`, `Response`, etc ...) that is
	// not typed as `AsyncIterable` (because of lacking browser implementation,
	// see https://github.com/microsoft/TypeScript/issues/29867). The former is
	// an internale node implementation that is typed `AsyncIterable`. We need a
	// readable stream that is async iterable so we use
	// `webstream.ReadableStream`, and this function simply cast it to
	// `ReadableStream` (they are both the same implementation on node side), so
	// it can be used with web-plateform apis.

	return /** @type {any} */ (stream);
}

/** @type {import('./readableStream.js').readStringStream} */
export async function readStringStream(stream) {
	const chunks = [];

	for await (const chunk of stream) {
		chunks.push(chunk);
	}

	return chunks.join("");
}

/** @type {import('./readableStream.js').readStream} */
export async function readStream(stream) {
	/** @type {Uint8Array[]} */
	const chunks = [];

	for await (const chunk of stream) {
		chunks.push(chunk);
	}

	const destArray = new Uint8Array(chunks.reduce((total, chunk) => total + chunk.length, 0));
	chunks.reduce((index, chunk) => {
		destArray.set(chunk, index);
		return index + chunk.length;
	}, 0);

	return destArray;
}

// adapted from https://deno.land/std@0.177.0/streams/text_line_stream.ts?source=#L19
/** @type {import('./readableStream.js').TextLineStream} */
export class TextLineStream extends TransformStream {
	#buf = "";

	constructor() {
		super({
			transform: (chunk, controller) => {
				this.#handle(chunk, controller);
			},
			flush: (controller) => {
				if (this.#buf.length > 0) {
					controller.enqueue(this.#buf);
				}
			},
		});
	}

	/**
	 * @param {string} chunk
	 * @param {webstream.TransformStreamDefaultController<string>} controller
	 */
	#handle(chunk, controller) {
		// biome-ignore lint/style/noParameterAssign: code taken from deno std lib
		chunk = this.#buf + chunk;
		for (;;) {
			const lfIndex = chunk.indexOf("\n");
			if (lfIndex !== -1) {
				let crOrLfIndex = lfIndex;
				if (chunk[lfIndex - 1] === "\r") {
					crOrLfIndex--;
				}
				controller.enqueue(chunk.slice(0, crOrLfIndex));
				// biome-ignore lint/style/noParameterAssign: code taken from deno std lib
				chunk = chunk.slice(lfIndex + 1);
				continue;
			}
			break;
		}
		this.#buf = chunk;
	}
}

/** @type {import('./readableStream.js').mergeReadableStreams} */
export function mergeReadableStreams(...streams) {
	const resolvePromises = streams.map(() => Deferred.create());

	return new webstream.ReadableStream({
		start(controller) {
			let mustClose = false;
			Promise.all(resolvePromises)
				.then(() => {
					controller.close();
				})
				.catch((error) => {
					mustClose = true;
					controller.error(error);
				});

			for (const [index, stream] of streams.entries()) {
				(async () => {
					try {
						for await (const data of stream) {
							if (mustClose) {
								break;
							}
							controller.enqueue(data);
						}
						resolvePromises[index].resolve();
					} catch (error) {
						resolvePromises[index].reject(error);
					}
				})();
			}
		},
	});
}
