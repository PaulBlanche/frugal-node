/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { test } from "node:test";
import { compress } from "../../../../src/server/middleware/compress.js";
import * as readableStream from "../../../../src/utils/readableStream.js";
import * as fixtures from "./fixtures.js";

test("unit/server/compress: skip on compression disabled", async () => {
	const context = fixtures.makeRouterContext({
		compress: undefined,
	});
	const nextResponse = new Response();

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/compress: skip on HEAD method", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["gzip", "br"], threshold: 1024 },
		request: fixtures.makeRequest({ method: "HEAD" }),
	});
	const nextResponse = new Response();

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/compress: skip on no body", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["gzip", "br"], threshold: 1024 },
		request: fixtures.makeRequest({ method: "GET" }),
	});
	const nextResponse = new Response(null);

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/compress: skip on already compressed", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["gzip", "br"], threshold: 1024 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("not null", {
		headers: new Headers({
			"Content-Encoding": "br",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/compress: skip on body too small", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["gzip", "br"], threshold: 1024 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("not null", {
		headers: new Headers({
			"Content-Length": "10",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/compress: compress gzip", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["gzip"], threshold: 1 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("hello", {
		headers: new Headers({
			"Content-Length": "10",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(response.headers.get("content-encoding"), "gzip");
	assert.deepEqual(
		await readableStream.readStream(/** @type {any} */ (response.body)),
		new Uint8Array([
			31, 139, 8, 0, 0, 0, 0, 0, 0, 3, 203, 72, 205, 201, 201, 7, 0, 134, 166, 16, 54, 5, 0,
			0, 0,
		]),
	);
});

test("unit/server/compress: compress brotli", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["br"], threshold: 1 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("hello", {
		headers: new Headers({
			"Content-Length": "10",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(response.headers.get("content-encoding"), "br");
	assert.deepEqual(
		await readableStream.readStream(/** @type {any} */ (response.body)),
		new Uint8Array([11, 2, 128, 104, 101, 108, 108, 111, 3]),
	);
});

test("unit/server/compress: compress deflate", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["deflate"], threshold: 1 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("hello", {
		headers: new Headers({
			"Content-Length": "10",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(response.headers.get("content-encoding"), "deflate");
	assert.deepEqual(
		await readableStream.readStream(/** @type {any} */ (response.body)),
		new Uint8Array([120, 156, 203, 72, 205, 201, 201, 7, 0, 6, 44, 2, 21]),
	);
});

test("unit/server/compress: fallthrough first supported encoding", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["unsuported", "br", "gzip"], threshold: 1 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("hello", {
		headers: new Headers({
			"Content-Length": "10",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(response.headers.get("content-encoding"), "br");
	assert.deepEqual(
		await readableStream.readStream(/** @type {any} */ (response.body)),
		new Uint8Array([11, 2, 128, 104, 101, 108, 108, 111, 3]),
	);
});

test("unit/server/compress: skip ifno supported encoding", async () => {
	const context = fixtures.makeRouterContext({
		compress: { encodings: ["unsuported-1", "unsuported-2"], threshold: 1 },
		request: fixtures.makeRequest({
			method: "GET",
		}),
	});
	const nextResponse = new Response("hello", {
		headers: new Headers({
			"Content-Length": "10",
		}),
	});

	const response = await compress(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});
