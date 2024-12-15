/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { forceGenerateStaticPage } from "../../../../src/server/middleware/forceGenerateStaticPage.js";
import * as fixtures from "./fixtures.js";

test("unit/server/forceGenerateStaticPage: non GET request", async () => {
	const producerGenerate = mock.fn(() => Promise.resolve(undefined));
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "POST",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => false,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: producerGenerate,
			}),
		}),
	});
	const nextResponse = new Response();

	await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(producerGenerate.mock.callCount(), 1);
});

test("unit/server/forceGenerateStaticPage: GET request and not shouldForceGenerate", async () => {
	const producerGenerate = mock.fn(() => Promise.resolve(undefined));
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "GET",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => false,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: producerGenerate,
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
	assert.strictEqual(producerGenerate.mock.callCount(), 0);
});

test("unit/server/forceGenerateStaticPage: GET request and shouldForceGenerate", async () => {
	const producerGenerate = mock.fn(() => Promise.resolve(undefined));
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "POST",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => true,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: producerGenerate,
			}),
		}),
	});
	const nextResponse = new Response();

	await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(producerGenerate.mock.callCount(), 1);
});

test("unit/server/forceGenerateStaticPage: force generation with no response", async () => {
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "GET",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => true,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: () => Promise.resolve(undefined),
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/forceGenerateStaticPage: force generation with response", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		status: 200,
		body: "foo",
		headers: new Headers(),
		date: new Date().toUTCString(),
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "GET",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => true,
			cleanupForceGenerate: () => {
				// empty
			},
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: () => Promise.resolve(frugalResponse),
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(await response.text(), frugalResponse.body);
	assert.deepEqual(Array.from(response.headers), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"1WFOYLC"'],
		["x-frugal-generation-date", frugalResponse.date],
	]);
	assert.strictEqual(response.status, 200);
});

test("unit/server/forceGenerateStaticPage: no cleanup on non GET", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		status: 200,
		body: "foo",
		headers: new Headers(),
		date: new Date().toUTCString(),
	});
	const cleanup = mock.fn(() => {
		// empty
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "POST",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => true,
			cleanupForceGenerate: cleanup,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: () => Promise.resolve(frugalResponse),
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(await response.text(), frugalResponse.body);
	assert.deepEqual(Array.from(response.headers), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"1WFOYLC"'],
		["x-frugal-generation-date", frugalResponse.date],
	]);
	assert.strictEqual(response.status, 200);
	assert.strictEqual(cleanup.mock.callCount(), 0);
});

test("unit/server/forceGenerateStaticPage: no cleanup on GET whith no shouldForceGenerate", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		status: 200,
		body: "foo",
		headers: new Headers(),
		date: new Date().toUTCString(),
	});
	const cleanup = mock.fn(() => {
		// empty
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "GET",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => false,
			cleanupForceGenerate: cleanup,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: () => Promise.resolve(frugalResponse),
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
	assert.strictEqual(cleanup.mock.callCount(), 0);
});

test("unit/server/forceGenerateStaticPage: cleanup on GET and shouldForceGenerate", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		status: 200,
		body: "foo",
		headers: new Headers(),
		date: new Date().toUTCString(),
	});
	const cleanup = mock.fn(() => {
		// empty
	});
	const context = fixtures.makeRouterContext({
		request: fixtures.makeRequest({
			method: "GET",
		}),
		url: new URL("http://example.com/foo"),
		cacheHandler: fixtures.makeCacheHandler({
			shouldForceGenerate: () => true,
			cleanupForceGenerate: cleanup,
		}),
		route: fixtures.makeRoute({
			producer: fixtures.makeProducer({
				generate: () => Promise.resolve(frugalResponse),
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await forceGenerateStaticPage(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(await response.text(), frugalResponse.body);
	assert.deepEqual(Array.from(response.headers), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"1WFOYLC"'],
		["x-frugal-generation-date", frugalResponse.date],
	]);
	assert.strictEqual(response.status, 200);
	assert.strictEqual(cleanup.mock.callCount(), 1);
});
