/** @import * as webStream from "node:stream/web" */
/** @import * as net from "node:net" */
/** @import * as self from "./serve.js" */

import * as http from "node:http";
import * as https from "node:https";
import * as path from "node:path";
import * as stream from "node:stream";
import { Hash } from "./Hash.js";

/** @type {self.serve} */
export function serve(handler, options = {}) {
	const server = options.cert
		? https.createServer(
				{
					cert: options.cert,
					key: options.key,
				},
				nativeHandler(handler),
			)
		: http.createServer(nativeHandler(handler));

	options.signal?.addEventListener("abort", () => {
		server.close();
	});

	const port = options.port ?? 8000;
	const hostname = options.hostname ?? "0.0.0.0";

	/** @type {PromiseWithResolvers<{ hostname:string, port:number }>} */
	const listeningDeferred = Promise.withResolvers();
	/** @type {PromiseWithResolvers<void>} */
	const finishedDeferred = Promise.withResolvers();

	server.on("close", () => {
		finishedDeferred.resolve();
	});

	try {
		server.listen(port, hostname, () => {
			listeningDeferred.resolve({ hostname, port });
		});
	} catch (error) {
		listeningDeferred.reject(error);
		finishedDeferred.resolve();
	}

	return { listening: listeningDeferred.promise, finished: finishedDeferred.promise };
}

/** @type {self.nativeHandler} */
export function nativeHandler(handler) {
	return async (req, res) => {
		const host = req.headers.host ?? "localhost";

		/** Socket might come from an https connection and have the `encrypted` property  */
		const protocol = /** @type {net.Socket & { encrypted?: boolean }} */ (req.socket).encrypted
			? "https:"
			: "http:";

		const origin = `${protocol}//${host}`;

		const parsed = new URL(origin);

		const request = toRequest(origin, req);

		const response = await handler(request, {
			hostname: parsed.hostname,
			port: parsed.port,
			identifier: identifier(request, req),
		});

		// for event-stream Response we need to close the body stream when the
		// client disconnects. The client disconnect triggers a `close` event on
		// the request. Here we need to close the underlying stream but it is
		// locked. The `close` method added for event-stream Response bypass the
		// lock by closing directly on the underlying controller of the stream
		if (isEventStreamResponse(response)) {
			req.on("close", () => {
				response.close();
			});
		}

		answerWithResponse(response, res);
	};
}

/**
 * @param {Response} response
 * @param {http.ServerResponse<http.IncomingMessage>} res
 */
async function answerWithResponse(response, res) {
	res.writeHead(response.status, response.statusText, toOutgoingHeaders(response.headers));

	if (response.body !== null) {
		for await (const chunk of /** @type {webStream.ReadableStream<Uint8Array>} */ (
			response.body
		)) {
			res.write(chunk);
		}
	}

	// close after writing the body only if it is not an SSE Response
	if (!isEventStreamResponse(response)) {
		res.end();
	}

	return;
}

/**
 * @param {Headers} headers
 * @returns {Record<string, string | string[]>}
 */
function toOutgoingHeaders(headers) {
	/** @type {Record<string, string | string[]>} */
	const outgoingHeaders = {};
	for (const [name, value] of headers.entries()) {
		const currentValue = outgoingHeaders[name];
		if (currentValue === undefined) {
			outgoingHeaders[name] = value;
		} else if (typeof currentValue === "string") {
			outgoingHeaders[name] = [currentValue, value];
		} else {
			outgoingHeaders[name] = [...currentValue, value];
		}
	}

	return outgoingHeaders;
}

const BODYLESS_METHODS = ["HEAD", "GET"];

/**
 * @param {string} origin
 * @param {http.IncomingMessage} req
 */
function toRequest(origin, req) {
	// `IncomingMessage` is typed with `url: string|undefined` because it could
	// come from a Server (with an url) or a ClientRequest (without an url). We
	// are 100% in the server case, so `url` is guaranteed to be `string`.
	const url = /** @type {string} */ (req.url);

	const headers = new Headers();
	for (const [name, value] of Object.entries(req.headers)) {
		if (Array.isArray(value)) {
			for (const entry of value) {
				headers.append(name, entry);
			}
		} else if (value !== undefined) {
			headers.set(name, value);
		}
	}

	const method = req.method ?? "GET";

	const body = BODYLESS_METHODS.includes(method)
		? undefined
		: /** @type {ReadableStream} */ (stream.Readable.toWeb(req));

	return new Request(new URL(url, origin), {
		headers,
		method,
		body,
		// @ts-expect-error: duplex does not exists on node types, but needed to
		// send a body. See :
		// https://developer.chrome.com/articles/fetch-streaming-requests/#half-duplex
		duplex: body && "half",
	});
}

/**
 * @param {Request} request
 * @param {http.IncomingMessage} req
 * @returns {string}
 */
function identifier(request, req) {
	const requestUrl = new URL(request.url);
	const normalizedInternalUrl =
		path.normalize(decodeURIComponent(requestUrl.pathname)) + requestUrl.search;

	const remoteHostname = getRemoteAddress(request, req) ?? "???";
	const method = request.method;

	const identifier = Hash.create()
		.update(normalizedInternalUrl)
		.update(remoteHostname)
		.update(method)
		.update(String(Date.now()))
		.digest();

	return identifier;
}

const FORWARDED_FOR_REGEXP = /\s*,\s*/;

/**
 * @param {Request} request
 * @param {http.IncomingMessage} req
 */
function getRemoteAddress(request, req) {
	const xForwardedFor = request.headers.get("X-Forwarded-For");
	if (!xForwardedFor) {
		return req.socket.remoteAddress;
	}
	const values = xForwardedFor.split(FORWARDED_FOR_REGEXP);
	return values[0];
}

/**
 * @param {Response | self.EventStreamResponse} response
 * @returns {response is self.EventStreamResponse}
 */
function isEventStreamResponse(response) {
	return "close" in response;
}
