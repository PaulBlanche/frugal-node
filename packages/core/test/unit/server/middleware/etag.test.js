/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { test } from "node:test";
import { etag } from "../../../../src/server/middleware/etag.js";
import * as fixtures from "./fixtures.js";

test("unit/server/etag: return response if no if-none-match in request", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			headers: new Headers(),
		}),
	});
	const nextResponse = new Response(null, { status: 200 });

	const response = await etag(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/etag: return response if no etag in response", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			headers: new Headers({
				"if-none-match": "foo",
			}),
		}),
	});
	const nextResponse = new Response(null, { status: 200 });

	const response = await etag(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/etag: return response if response etag not equal if-none-match request", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			headers: new Headers({
				"if-none-match": "foo",
			}),
		}),
	});
	const nextResponse = new Response(null, { status: 200, headers: { etag: "bar" } });

	const response = await etag(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/etag: return 304 for * if-none-match request", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			headers: new Headers({
				"if-none-match": "*",
			}),
		}),
	});
	const nextResponse = new Response(null, {
		status: 200,
		headers: {
			"content-location": "content-location",
			date: "date",
			etag: "etag",
			vary: "vary",
			"cache-control": "cache-control",
			expires: "expires",
			"content-type": "text",
		},
	});

	const response = await etag(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers), [
		["cache-control", "cache-control"],
		["content-location", "content-location"],
		["date", "date"],
		["etag", "etag"],
		["expires", "expires"],
		["vary", "vary"],
	]);
	assert.strictEqual(response.status, 304);
});

test("unit/server/etag: return 304 for etag in response equal to if-none-match request", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			headers: new Headers({
				"if-none-match": "etag",
			}),
		}),
	});
	const nextResponse = new Response(null, {
		status: 200,
		headers: {
			"content-location": "content-location",
			date: "date",
			etag: "etag",
			vary: "vary",
			"cache-control": "cache-control",
			expires: "expires",
			"content-type": "text",
		},
	});

	const response = await etag(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers), [
		["cache-control", "cache-control"],
		["content-location", "content-location"],
		["date", "date"],
		["etag", "etag"],
		["expires", "expires"],
		["vary", "vary"],
	]);
	assert.strictEqual(response.status, 304);
});
