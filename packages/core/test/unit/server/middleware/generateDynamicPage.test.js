/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { generateDynamicPage } from "../../../../src/server/middleware/generateDynamicPage.js";
import * as fixtures from "./fixtures.js";

test("unit/server/generateDynamicPage: skip non dynamic pages", async () => {
	const producerGenerate = mock.fn(() => Promise.resolve(undefined));
	const context = fixtures.makeRouterContext({
		route: fixtures.makeRoute({
			page: fixtures.makePage({
				type: "static",
			}),
			producer: fixtures.makeProducer({
				generate: producerGenerate,
			}),
		}),
	});
	const nextResponse = new Response();

	const response = await generateDynamicPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
	assert.strictEqual(producerGenerate.mock.callCount(), 0);
});

test("unit/server/generateDynamicPage: no frugal response", async () => {
	const producerGenerate = mock.fn(() => Promise.resolve(undefined));
	const context = fixtures.makeRouterContext({
		route: fixtures.makeRoute({
			page: fixtures.makePage({
				type: "dynamic",
			}),
			producer: fixtures.makeProducer({
				generate: producerGenerate,
			}),
		}),
		url: new URL("http://example.com/foo"),
	});
	const nextResponse = new Response();

	const response = await generateDynamicPage(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
	assert.strictEqual(producerGenerate.mock.callCount(), 1);
});

test("unit/server/generateDynamicPage: frugal response", async () => {
	const frugalResponse = fixtures.makeFrugalResponse({
		status: 200,
		body: "foo",
		headers: new Headers(),
		date: new Date().toUTCString(),
	});
	const context = fixtures.makeRouterContext({
		route: fixtures.makeRoute({
			page: fixtures.makePage({
				type: "dynamic",
			}),
			producer: fixtures.makeProducer({
				generate: () => Promise.resolve(frugalResponse),
			}),
		}),
		url: new URL("http://example.com/foo"),
	});
	const nextResponse = new Response();

	const response = await generateDynamicPage(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.strictEqual(await response.text(), frugalResponse.body);
	assert.deepEqual(Array.from(response.headers), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"1WFOYLC"'],
		["x-frugal-generation-date", frugalResponse.date],
	]);
	assert.strictEqual(response.status, 200);
});
