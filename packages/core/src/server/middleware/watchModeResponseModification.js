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
 * @param {webStream.ReadableStream<Uint8Array>} responseBody
 */
async function injectLivereloadScript(responseBody) {
	const body = DECODER.decode(await readableStream.readStream(responseBody));

	// try to put script at the end of `<body>`
	if (body.indexOf("</body>") !== -1) {
		return body.replace("</body>", `<script>${livereloadScript}</script></body>`);
	}

	// try to put script at the end of `<html>` if body is absent
	if (body.indexOf("</html>") !== -1) {
		return body.replace("</html>", `<script>${livereloadScript}</script></html>`);
	}

	// put script at the end of document if no `<body>` or `<html>
	return `${body}<script>${livereloadScript}</script>`;
}
