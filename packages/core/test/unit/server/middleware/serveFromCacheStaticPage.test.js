/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { serveFromCacheStaticPage } from "../../../../src/server/middleware/serveFromCacheStaticPage.js";
import * as fixtures from "./fixtures.js";

test("unit/server/serveFromCacheStaticPage: skip on non GET", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "POST" }),
	});
	const nextResponse = new Response();

	const response = await serveFromCacheStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/serveFromCacheStaticPage: skip on no cache", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		log: () => {
			//empty
		},
		cache: undefined,
	});
	const nextResponse = new Response();

	const response = await serveFromCacheStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/serveFromCacheStaticPage: skip if no data in cache", async () => {
	const cacheGet = mock.fn(() => Promise.resolve(undefined));
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		log: () => {
			//empty
		},
		cache: fixtures.makeServerCache({
			get: cacheGet,
		}),
		url: new URL("http://example.com/foo"),
	});
	const nextResponse = new Response();

	const response = await serveFromCacheStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
	assert.strictEqual(cacheGet.mock.callCount(), 1);
});

test("unit/server/serveFromCacheStaticPage: skip if stale in cache", async () => {
	const cacheResponse = fixtures.makeFrugalResponse({
		date: new Date(Date.now() - 10 * 1000).toUTCString(), // 10 seconds ago
		maxAge: 9, // 9 seconds
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		log: () => {
			//empty
		},
		cache: fixtures.makeServerCache({
			get: () => Promise.resolve(cacheResponse),
		}),
		url: new URL("http://example.com/foo"),
	});
	const nextResponse = new Response();

	const response = await serveFromCacheStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/serveFromCacheStaticPage: serve from cache if not stale", async () => {
	const cacheResponse = fixtures.makeFrugalResponse({
		date: new Date(Date.now() - 10 * 1000).toUTCString(), // 10 seconds ago
		maxAge: 11, // 11 seconds
		status: 200,
		body: "foo",
		headers: new Headers(),
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		log: () => {
			//empty
		},
		cache: fixtures.makeServerCache({
			get: () => Promise.resolve(cacheResponse),
		}),
		url: new URL("http://example.com/foo"),
	});
	const nextResponse = new Response();

	const response = await serveFromCacheStaticPage(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(await response.text(), cacheResponse.body);
	assert.deepEqual(Array.from(response.headers), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"1WFOYLC"'],
		["x-frugal-generation-date", cacheResponse.date],
	]);
	assert.strictEqual(response.status, 200);
});

test("unit/server/serveFromCacheStaticPage: serve from cache if negative maxAge", async () => {
	const cacheResponse = fixtures.makeFrugalResponse({
		date: new Date(0).toUTCString(), // dawn of unix time
		maxAge: -1,
		status: 200,
		body: "foo",
		headers: new Headers(),
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		log: () => {
			//empty
		},
		cache: fixtures.makeServerCache({
			get: () => Promise.resolve(cacheResponse),
		}),
		url: new URL("http://example.com/foo"),
	});
	const nextResponse = new Response();

	const response = await serveFromCacheStaticPage(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(await response.text(), cacheResponse.body);
	assert.deepEqual(Array.from(response.headers), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"1WFOYLC"'],
		["x-frugal-generation-date", cacheResponse.date],
	]);
	assert.strictEqual(response.status, 200);
});
