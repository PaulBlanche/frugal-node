import * as assert from "node:assert/strict";
import { test } from "node:test";
import { normalize } from "../../../src/utils/error.js";

test("unit/error: normalize standard error", () => {
	const normalized = normalize(new Error("foo", { cause: new SyntaxError("bar") }));

	assert.deepEqual(normalized, {
		name: "Error",
		message: "foo",
		stack: [
			{
				location: {
					col: 31,
					file: "/home/whiteshoulders/projects/frugal/packages/core/test/unit/utils/error.test.js",
					line: 6,
					type: "file",
				},
				name: "TestContext.&lt;anonymous&gt;",
			},
		],
		cause: {
			name: "SyntaxError",
			message: "bar",
			stack: [
				{
					location: {
						col: 57,
						file: "/home/whiteshoulders/projects/frugal/packages/core/test/unit/utils/error.test.js",
						line: 6,
						type: "file",
					},
					name: "TestContext.&lt;anonymous&gt;",
				},
			],
			cause: undefined,
		},
	});
});

test("unit/error: relative paths", () => {
	const normalized = normalize(new Error("foo"), import.meta.dirname);

	assert.deepEqual(normalized, {
		name: "Error",
		message: "foo",
		stack: [
			{
				location: {
					col: 31,
					file: "error.test.js",
					line: 42,
					type: "file",
				},
				name: "TestContext.&lt;anonymous&gt;",
			},
		],
		cause: undefined,
	});
});

test("unit/error: non standard errors", () => {
	const normalized = normalize(
		{ name: "foo", message: "bar", stack: `at parse (${import.meta.dirname}/fu/bar.js:12:24)` },
		import.meta.dirname,
	);

	assert.deepEqual(normalized, {
		name: "foo",
		message: "bar",
		stack: [
			{
				location: {
					col: 24,
					file: "fu/bar.js",
					line: 12,
					type: "file",
				},
				name: "parse",
			},
		],
		cause: undefined,
	});
});

test("unit/error: non plain object errors", () => {
	const error = function foo() {
		//empty
	};
	error.message = "bar";
	error.stack = `at parse (${import.meta.dirname}/fu/bar.js:12:24)`;
	const normalized = normalize(error, import.meta.dirname);

	assert.deepEqual(normalized, {
		name: "foo",
		message: "bar",
		stack: [
			{
				location: {
					col: 24,
					file: "fu/bar.js",
					line: 12,
					type: "file",
				},
				name: "parse",
			},
		],
		cause: undefined,
	});
});
