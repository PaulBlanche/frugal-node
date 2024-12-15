/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { buildJitStaticPage } from "../../../../src/server/middleware/buildJitStaticPage.js";
import * as readableStream from "../../../../src/utils/readableStream.js";
import * as fixtures from "./fixtures.js";

test("unit/server/buildJitStaticPage: non GET request", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "POST" }),
	});
	const nextResponse = new Response();

	const response = await buildJitStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/buildJitStaticPage: producer with undefined response", async () => {
	const producerBuild = mock.fn(() => Promise.resolve(undefined));
	const params = { foo: "bar" };
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		params,
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				build: producerBuild,
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await buildJitStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
	assert.strictEqual(producerBuild.mock.callCount(), 1);
	assert.deepEqual(producerBuild.mock.calls[0].arguments, [{ params }]);
});

test("unit/server/buildJitStaticPage: producer with response without cache", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		headers: new Headers(),
		status: 200,
		body: "",
		date: new Date().toUTCString(),
	});
	const producerBuild = mock.fn(() => Promise.resolve(frugalResponse));
	const params = { foo: "bar" };
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		params,
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				build: producerBuild,
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await buildJitStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response.status, frugalResponse.status);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"0"'],
		["x-frugal-generation-date", frugalResponse.date],
	]);
	assert.notStrictEqual(response.body, null);
	assert.strictEqual(
		new TextDecoder().decode(
			await readableStream.readStream(/** @type {any} */ (response.body)),
		),
		frugalResponse.body,
	);
	assert.strictEqual(producerBuild.mock.callCount(), 1);
	assert.deepEqual(producerBuild.mock.calls[0].arguments, [{ params }]);
});

test("unit/server/buildJitStaticPage: producer with response with cache", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		headers: new Headers(),
		status: 200,
		body: "",
		date: new Date().toUTCString(),
	});
	const producerBuild = mock.fn(() => Promise.resolve(frugalResponse));
	const cacheAdd = mock.fn(() => Promise.resolve());
	const params = { foo: "bar" };
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({ method: "GET" }),
		params,
		cache: fixtures.makeServerCache({
			add: cacheAdd,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				build: producerBuild,
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await buildJitStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response.status, frugalResponse.status);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"0"'],
		["x-frugal-generation-date", frugalResponse.date],
	]);
	assert.notStrictEqual(response.body, null);
	assert.strictEqual(
		new TextDecoder().decode(
			await readableStream.readStream(/** @type {any} */ (response.body)),
		),
		frugalResponse.body,
	);
	assert.strictEqual(producerBuild.mock.callCount(), 1);
	assert.deepEqual(producerBuild.mock.calls[0].arguments, [{ params }]);
	assert.strictEqual(cacheAdd.mock.callCount(), 1);
	assert.deepEqual(cacheAdd.mock.calls[0].arguments, [frugalResponse]);
});
