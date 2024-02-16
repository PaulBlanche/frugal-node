import * as http from "node:http";
import * as https from "node:https";
import * as net from "node:net";
import * as path from "node:path";
import * as stream from "node:stream";
import * as hash from "../hash.js";
import * as readableStream from "../readableStream.js";
import * as _type from "./_type/serve.js";

/** @typedef {_type.Handler} Handler */
/** @typedef {_type.HandlerInfo} HandlerInfo */
/** @typedef {_type.ServeOptions} ServeOptions */
/** @typedef {_type.EventStreamResponse} EventStreamResponse */
/** @typedef {http.RequestListener} NativeHandler */

/**
 * @param {_type.Handler} handler
 * @param {_type.ServeOptions} [options]
 * @returns {Promise<void>}
 */
export function serve(
	handler,
	{ port = 8000, hostname = "0.0.0.0", onListen, signal, ...secureOptions } = {},
) {
	const server = secureOptions.cert
		? https.createServer(
				{
					cert: secureOptions.cert,
					key: secureOptions.key,
				},
				nativeHandler(handler),
		  )
		: http.createServer(nativeHandler(handler));

	server.listen(port, hostname, () => {
		onListen?.({ hostname, port });
	});

	return new Promise((res, rej) => {
		signal?.addEventListener("abort", () => server.close(() => setTimeout(res, 100)));
	});
}

/**
 * @param {_type.Handler} handler,
 * @returns {NativeHandler}
 */
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
			identifier: await identifier(request, req),
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
		for await (const chunk of readableStream.fromReadableStream(response.body)) {
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
 * @returns {Promise<string>}
 */
async function identifier(request, req) {
	const requestUrl = new URL(request.url);
	const normalizedInternalUrl =
		path.normalize(decodeURIComponent(requestUrl.pathname)) + requestUrl.search;

	const remoteHostname = getRemoteAddress(request, req) ?? "???";
	const method = request.method;

	const identifier = hash
		.create()
		.update(normalizedInternalUrl)
		.update(remoteHostname)
		.update(method)
		.update(String(Date.now()))
		.digest();

	return identifier;
}

/**
 * @param {Request} request
 * @param {http.IncomingMessage} req
 */
function getRemoteAddress(request, req) {
	const xForwardedFor = request.headers.get("X-Forwarded-For");
	if (!xForwardedFor) {
		return req.socket.remoteAddress;
	}
	const values = xForwardedFor.split(/\s*,\s*/);
	return values[0];
}

/**
 * @param {Response | _type.EventStreamResponse} response
 * @returns {response is _type.EventStreamResponse}
 */
function isEventStreamResponse(response) {
	return "close" in response;
}
