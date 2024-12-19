/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { test } from "node:test";
import { strictPathCheck } from "../../../../src/server/middleware/strictPathCheck.js";
import * as fixtures from "./fixtures.js";

test("unit/server/strictPathCheck: skip on non static page", async () => {
	const context = fixtures.makeRouterContext({
		route: fixtures.makeRoute({
			page: fixtures.makePage({ type: "dynamic" }),
		}),
	});
	const nextResponse = new Response();
	const middlewareResponse = new Response();

	const response = await strictPathCheck([() => Promise.resolve(middlewareResponse)])(
		context,
		() => Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, nextResponse);
});

test("unit/server/strictPathCheck: forward to middleware if not strict paths", async () => {
	const context = fixtures.makeRouterContext({
		route: fixtures.makeRoute({
			page: fixtures.makeStaticPage({ type: "static", strictPaths: false }),
		}),
	});
	const nextResponse = new Response();
	const middlewareResponse = new Response();

	const response = await strictPathCheck([() => Promise.resolve(middlewareResponse)])(
		context,
		() => Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, middlewareResponse);
});

test("unit/server/strictPathCheck: forward to middleware if not paramList", async () => {
	const context = fixtures.makeRouterContext({
		route: fixtures.makeRoute({
			page: fixtures.makeStaticPage({ type: "static", strictPaths: true }),
			paramList: undefined,
		}),
	});
	const nextResponse = new Response();
	const middlewareResponse = new Response();

	const response = await strictPathCheck([() => Promise.resolve(middlewareResponse)])(
		context,
		() => Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, middlewareResponse);
});

test("unit/server/strictPathCheck: forward to middleware if path in paramList", async () => {
	const context = fixtures.makeRouterContext({
		url: new URL("http://example.com/foo/bar"),
		route: fixtures.makeRoute({
			page: fixtures.makeStaticPage({
				type: "static",
				strictPaths: true,
				compile: (param) => `/foo/${param["slug"]}`,
			}),
			paramList: [{ slug: "foo" }, { slug: "bar" }],
		}),
	});
	const nextResponse = new Response();
	const middlewareResponse = new Response();

	const response = await strictPathCheck([() => Promise.resolve(middlewareResponse)])(
		context,
		() => Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, middlewareResponse);
});

test("unit/server/strictPathCheck: skip if path not in paramList", async () => {
	const context = fixtures.makeRouterContext({
		url: new URL("http://example.com/foo/quux"),
		route: fixtures.makeRoute({
			page: fixtures.makeStaticPage({
				type: "static",
				strictPaths: true,
				compile: (param) => `/foo/${param["slug"]}`,
			}),
			paramList: [{ slug: "foo" }, { slug: "bar" }],
		}),
	});
	const nextResponse = new Response();
	const middlewareResponse = new Response();

	const response = await strictPathCheck([() => Promise.resolve(middlewareResponse)])(
		context,
		() => Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, nextResponse);
});
