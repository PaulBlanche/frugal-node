/** @import * as self from "./readableStream.js" */

import * as webstream from "node:stream/web";

/** @type {self.readStream} */
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
/** @type {self.TextLineStream} */
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

/** @type {self.mergeReadableStreams} */
export function mergeReadableStreams(...streams) {
	const deferreds = streams.map(
		() => /** @type {PromiseWithResolvers<void>} */ (Promise.withResolvers()),
	);

	return new webstream.ReadableStream({
		start(controller) {
			let mustClose = false;

			Promise.all(deferreds.map((deferred) => deferred.promise))
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
						deferreds[index].resolve();
					} catch (error) {
						deferreds[index].reject(error);
					}
				})();
			}
		},
	});
}
