import * as assert from "node:assert/strict";
import { test } from "node:test";
import { composeMiddleware } from "../../../src/server/middleware.js";

test("unit/server/composeMiddleware: empty array", async () => {
	const composed = composeMiddleware([]);
	const nextResponse = new Response();

	const response = await composed({}, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/composeMiddleware: call order", async () => {
	/** @type {number[]} */
	const beforeNext = [];
	/** @type {number[]} */
	const afterNext = [];
	const composed = composeMiddleware([
		async (context, next) => {
			beforeNext.push(1);
			const response = await next(context);
			afterNext.push(1);
			return response;
		},
		async (context, next) => {
			beforeNext.push(2);
			const response = await next(context);
			afterNext.push(2);
			return response;
		},
		async (context, next) => {
			beforeNext.push(3);
			const response = await next(context);
			afterNext.push(3);
			return response;
		},
	]);
	const nextResponse = new Response();

	await composed({}, () => Promise.resolve(nextResponse));

	assert.deepEqual(beforeNext, [1, 2, 3]);
	assert.deepEqual(afterNext, [3, 2, 1]);
});

test("unit/server/composeMiddleware: context passage", async () => {
	/** @type {any[]} */
	const contexts = [];
	const composed = composeMiddleware([
		async (context, next) => {
			contexts.push(context);
			const response = await next({ foo: 1 });
			return response;
		},
		async (context, next) => {
			contexts.push(context);
			const response = await next({ ...context, bar: 2 });
			return response;
		},
		async (context, next) => {
			contexts.push(context);
			const response = await next(context);
			return response;
		},
	]);
	const nextResponse = new Response();

	await composed({ foo: 0 }, () => Promise.resolve(nextResponse));

	assert.deepEqual(contexts, [{ foo: 0 }, { foo: 1 }, { foo: 1, bar: 2 }]);
});
