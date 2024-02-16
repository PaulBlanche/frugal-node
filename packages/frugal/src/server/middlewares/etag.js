import * as context from "../context.js";
import * as middleware from "../middleware.js";

/**
 * @template {context.BaseContext} CONTEXT
 * @param {CONTEXT} context
 * @param {middleware.Next<CONTEXT>} next
 */
export async function etag(context, next) {
	const response = await next(context);

	if (ifNoneMatch(context.request, response)) {
		return response;
	}

	context.log("response Etag headers match request If-None-Match header, send 304", {
		level: "debug",
		scope: "etag",
	});

	return new Response(null, {
		status: 304, //not modified
		statusText: "Not Modified",
		headers: headersNotModified(response.headers),
	});
}

/**
 * @param {Request} request
 * @param {Response} response
 */
function ifNoneMatch(request, response) {
	const ifNoneMatch = request.headers.get("If-None-Match");
	if (ifNoneMatch === null) {
		return true;
	}

	if (ifNoneMatch.trim() === "*") {
		return false;
	}

	const etag = response.headers.get("Etag");
	const tags = ifNoneMatch.split(/\s*,\s*/);
	return etag === null || !tags.includes(etag);
}

const HEADERS_NOT_MODIFIED = [
	"Content-Location",
	"Date",
	"Etag",
	"Vary",
	"Cache-Control",
	"Expires",
];

/** @param {Headers} headers */
function headersNotModified(headers) {
	const headersNotModified = new Headers();

	for (const headerName of HEADERS_NOT_MODIFIED) {
		const headerValue = headers.get(headerName);
		if (headerValue !== null) {
			headersNotModified.set(headerName, headerValue);
		}
	}

	return headersNotModified;
}
