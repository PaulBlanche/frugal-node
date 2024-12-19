/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { router } from "../../../../src/server/middleware/router.js";
import * as fixtures from "./fixtures.js";

test("unit/server/router: skip if no match", async () => {
	const context = fixtures.makeContext({
		url: new URL("http://example.com/foo"),
		log: () => {
			// empty
		},
	});
	const nextResponse = new Response();
	const routerResponse = new Response();

	const routes = [
		fixtures.makeRoute({
			page: fixtures.makePage({
				match: () => false,
			}),
		}),
	];

	const response = await router(routes, [() => Promise.resolve(routerResponse)])(context, () =>
		Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, nextResponse);
});

test("unit/server/router: route to first match", async () => {
	const context = fixtures.makeContext({
		url: new URL("http://example.com/foo"),
		log: () => {
			// empty
		},
	});
	const nextResponse = new Response();
	const routerResponse = new Response();

	const routes = [
		fixtures.makeRoute({
			page: fixtures.makePage({
				match: () => false,
			}),
		}),
		fixtures.makeRoute({
			page: fixtures.makePage({
				match: () => ({ path: "", params: { foo: "bar" } }),
			}),
		}),
		fixtures.makeRoute({
			page: fixtures.makePage({
				match: () => ({ path: "", params: { baz: "quux" } }),
			}),
		}),
	];

	const routeHandlerMiddleware = mock.fn((_context) => Promise.resolve(routerResponse));
	const response = await router(routes, [routeHandlerMiddleware])(context, () =>
		Promise.resolve(nextResponse),
	);

	assert.strictEqual(response, routerResponse);
	assert.strictEqual(routeHandlerMiddleware.mock.callCount(), 1);
	assert.deepEqual(routeHandlerMiddleware.mock.calls[0].arguments[0], {
		...context,
		route: routes[1],
		params: { foo: "bar" },
	});
});
