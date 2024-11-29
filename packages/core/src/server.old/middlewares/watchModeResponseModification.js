/** @import * as self from "./watchModeResponseModification.js" */
/** @import * as webStream from "node:stream/web" */

import * as readableStream from "../../utils/readableStream.js";
import livereloadScript from "../../watch/livereload/livereload.min.js";

/** @type {self.watchModeResponseModification} */
export async function watchModeResponseModification(context, next) {
	if (!context.watch) {
		return next(context);
	}

	const response = await next(context);
	const headers = new Headers(response.headers);

	// disable cache for every response in watchMode
	headers.set("Cache-Control", "no-store");

	// bail on empty or non html response
	if (!(response.body && headers.get("Content-Type")?.startsWith("text/html"))) {
		return new Response(response.body, {
			headers,
			status: response.status,
			statusText: response.statusText,
		});
	}

	// inject livereload script at the end of the document for non empty html
	// response
	return new Response(
		await injectLivereloadScript(/** @type {webStream.ReadableStream} */ (response.body)),
		{
			headers,
			status: response.status,
			statusText: response.statusText,
		},
	);
}

const DECODER = new TextDecoder();

/**
 * @param {import('node:stream/web').ReadableStream<Uint8Array>} responseBody
 */
async function injectLivereloadScript(responseBody) {
	//TODO : could be optimised, passing through the stream, intercepting and modifying the final chunk
	const body = DECODER.decode(await readableStream.readStream(responseBody));

	if (body.indexOf("</html>") !== -1) {
		return body.replace("</html>", `<script>${livereloadScript}</script></html>`);
	}
	return `${body}<script>${livereloadScript}</script>`;
}
