import * as assert from "node:assert/strict";
import { test } from "node:test";

import { hashableJsonValue } from "../../../src/utils/jsonValue.js";

test("utils/jsonValue.js: object key order", () => {
	assert.deepEqual(
		hashableJsonValue({ bar: "bar", foo: 1 }),
		hashableJsonValue({ foo: 1, bar: "bar" }),
		"object key order should not matter",
	);
});

test("utils/jsonValue.js: object and key-value array", () => {
	assert.notDeepEqual(
		hashableJsonValue({ bar: "bar", foo: true }),
		hashableJsonValue([
			["bar", "bar"],
			["foo", true],
		]),
		"object should be different from key-value array",
	);
});

test("utils/jsonValue.js: nested array/objects", () => {
	assert.deepEqual(
		hashableJsonValue({ bar: [{ quux: [true], baz: 1 }], foo: "foo" }),
		hashableJsonValue({ foo: "foo", bar: [{ baz: 1, quux: [true] }] }),
		"nested object should be handled",
	);
});

test.todo("utils/jsonValue.js: throw on non jsonValue value");
test.todo("utils/jsonValue.js: handle cycles");
