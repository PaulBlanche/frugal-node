/** @import * as self from "./compress.js" */
/** @import * as webstream from "node:stream/web" */

import { Transform } from "node:stream";
import * as zlib from "node:zlib";

/** @type {self.compress} */
export async function compress(context, next) {
	const response = await next(context);

	if (context.compress === undefined) {
		return response;
	}

	if (context.request.method === "HEAD") {
		return response;
	}

	const body = /** @type {webstream.ReadableStream<Uint8Array>}*/ (response.body);
	if (body === null) {
		return response;
	}

	const contentEncoding = response.headers.get("Content-Encoding");
	if (contentEncoding !== null) {
		return response;
	}

	const contentLength = response.headers.get("Content-Length");
	const length = Number(contentLength);
	if (!Number.isNaN(length) && length < context.compress.threshold) {
		return response;
	}

	for (const encoding of context.compress.encodings) {
		let nodeCompressionTransformer;
		switch (encoding) {
			case "gzip": {
				nodeCompressionTransformer = zlib.createGzip();
				response.headers.set("Content-Encoding", "gzip");
				break;
			}
			case "br": {
				nodeCompressionTransformer = zlib.createBrotliCompress();
				response.headers.set("Content-Encoding", "br");
				break;
			}
			case "deflate": {
				nodeCompressionTransformer = zlib.createDeflate();
				response.headers.set("Content-Encoding", "deflate");
				break;
			}
		}

		if (nodeCompressionTransformer === undefined) {
			continue;
		}

		const compressionTransformer = Transform.toWeb(nodeCompressionTransformer);
		body.pipeThrough(compressionTransformer);
		const reader = compressionTransformer.readable.getReader();

		return new Response(
			new ReadableStream({
				async pull(controller) {
					const result = await reader.read();
					if (result.value) {
						controller.enqueue(result.value);
					}
					if (result.done) {
						controller.close();
					}
				},
			}),
			response,
		);
	}

	return response;
}
