import * as readableStream from "../../utils/readableStream.js";
import livereloadScript from "../../watcher/livereload/livereload.min.js";

/** @type {import('./watchModeResponseModification.ts').watchModeResponseModification} */
export async function watchModeResponseModification(context, next) {
	if (!context.watch) {
		return next(context);
	}

	const response = await next(context);
	const headers = new Headers(response.headers);

	// disable cache for every response in watchMode
	headers.set("Cache-Control", "no-store");

	// bail on empty or non html response
	if (!response.body || !headers.get("Content-Type")?.startsWith("text/html")) {
		return new Response(response.body, {
			headers,
			status: response.status,
			statusText: response.statusText,
		});
	}

	const body = readableStream.fromReadableStream(response.body);

	// inject livereload script at the end of the document for non empty html
	// response
	return new Response(await injectLivereloadScript(body, context), {
		headers,
		status: response.status,
		statusText: response.statusText,
	});
}

const DECODER = new TextDecoder();

/**
 * @param {import('node:stream/web').ReadableStream<Uint8Array>} responseBody
 * @param {import("../context.ts").BaseContext} context
 */
async function injectLivereloadScript(responseBody, context) {
	//TODO : could be optimised, passing through the stream, intercepting and modifying the final chunk
	const body = DECODER.decode(await readableStream.readStream(responseBody));

	if (body.indexOf("</html>") !== -1) {
		return body.replace("</html>", `<script>${livereloadScript}</script></html>`);
	}
	return `${body}<script>${livereloadScript}</script>`;
}
