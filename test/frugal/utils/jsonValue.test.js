import * as assert from "node:assert/strict";
import { test } from "node:test";

import { hashableJsonValue } from "../../../packages/frugal/src/utils/jsonValue.js";

test("unit/frugal/utils/jsonValue.js: object key order", () => {
	assert.deepEqual(
		hashableJsonValue({ bar: "bar", foo: 1 }),
		hashableJsonValue({ foo: 1, bar: "bar" }),
		"object key order should not matter",
	);
});

test("unit/frugal/utils/jsonValue.js: object and key-value array", () => {
	assert.notDeepEqual(
		hashableJsonValue({ bar: "bar", foo: true }),
		hashableJsonValue([
			["bar", "bar"],
			["foo", true],
		]),
		"object should be different from key-value array",
	);

	assert.notDeepEqual(
		hashableJsonValue({ bar: "bar", foo: true }),
		hashableJsonValue([
			1,
			[
				["bar", "bar"],
				["foo", true],
			],
		]),
		"object should be different from key-value array",
	);
});

test("unit/frugal/utils/jsonValue.js: nested array/objects", () => {
	assert.deepEqual(
		hashableJsonValue({ bar: [{ quux: [true], baz: 1 }], foo: "foo" }),
		hashableJsonValue({ foo: "foo", bar: [{ baz: 1, quux: [true] }] }),
		"nested object should be handled",
	);
});

test("unit/frugal/utils/jsonValue.js: throw on non jsonValue value", () => {
	assert.throws(() => {
		hashableJsonValue(/** @type {any} */ ({ foo: () => {} }));
	});

	assert.throws(() => {
		hashableJsonValue(/** @type {any} */ ({ foo: new Date() }));
	});

	assert.throws(() => {
		hashableJsonValue(/** @type {any} */ ({ foo: /t/ }));
	});
});

test("unit/frugal/utils/jsonValue.js: handle cycles", () => {
	const value = { foo: /** @type {any}*/ (undefined) };
	value.foo = value;

	assert.deepEqual(hashableJsonValue(value), [1, [["foo", [2, 0]]]]);
	assert.notDeepEqual(hashableJsonValue(value), hashableJsonValue({ foo: [2, 0] }));
	assert.notDeepEqual(hashableJsonValue(value), hashableJsonValue({ foo: [0] }));
});

test("unit/frugal/utils/jsonValue.js: handle complex cycles", () => {
	const directCycle = { foo: /** @type {any}*/ (undefined) };
	directCycle.foo = directCycle;

	const indirectCycle = { foo: /** @type {any[]} */ ([0]) };
	indirectCycle.foo.push(indirectCycle);

	const value = {
		direct: directCycle,
		nested: [directCycle, indirectCycle],
		indirect: indirectCycle,
	};

	assert.deepEqual(hashableJsonValue(value), [
		1,
		[
			["direct", [1, [["foo", [2, 1]]]]],
			["indirect", [1, [["foo", [0, [0, [2, 2]]]]]]],
			[
				"nested",
				[
					0,
					[
						[2, 1],
						[2, 2],
					],
				],
			],
		],
	]);
});
