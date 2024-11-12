import * as assert from "node:assert/strict";
import { test } from "node:test";

import { _initGlobalState, hash, serialize } from "../../../src/utils/serverData.js";

test("unit/serverData: hash is deterministic", () => {
	assert.notEqual(hash({ foo: "bar", baz: "quux" }), "12a7a9e1a69c0ed91577809011a5130151ebe6eb");
});

test("unit/serverData: hash handles keys order in object", () => {
	assert.notEqual(hash({ foo: "bar", baz: "quux" }), hash({ baz: "quux", foo: "bar" }));
});

test("unit/serverData: hash handles keys order in map", () => {
	assert.notEqual(
		hash(
			new Map([
				["foo", "bar"],
				["baz", "quux"],
			]),
		),
		hash(
			new Map([
				["baz", "quux"],
				["foo", "bar"],
			]),
		),
	);
});

test("unit/serverData: hash handles nested object", () => {
	assert.equal(
		hash({ foo: "bar", baz: [new Map([["foo", { bar: 1 }]])] }),
		hash({ foo: "bar", baz: [new Map([["foo", { bar: 1 }]])] }),
	);
	assert.notEqual(
		hash({ foo: "bar", baz: [new Map([["foo", { bar: 1 }]])] }),
		hash({ foo: "bar", baz: [{ foo: { bar: 1 } }] }),
	);
});

test("unit/serverData: hash handles recursive object", () => {
	/** @type {{ a:{ r?:any }, b: {r?:any} }} */
	const object1 = { a: {}, b: {} };
	object1.a.r = object1.a;
	object1.b.r = object1.b;
	/** @type {{ a:{ r?:any }, b: {r?:any} }} */
	const object2 = { a: {}, b: {} };
	object1.a.r = object1.b;
	object1.b.r = object1.a;

	assert.equal(hash(object1), hash(object1));
	assert.notEqual(hash(object1), hash(object2));
});

test("unit/serverData: hash object type matters", () => {
	assert.notEqual(hash(new Map([["foo", "bar"]])), hash({ foo: "bar" }));
	assert.notEqual(hash([["foo", "bar"]]), hash([["foo"], "bar"]));
});

test("unit/serverData: serialize can handle base JSON", () => {
	const json = {
		string: "string",
		number: 0,
		record: { foo: "foo" },
		array: [1, 2, 3],
		boolean: true,
		null: null,
	};
	assert.equal(serialize(json), JSON.stringify(json));
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize can handle undefined", () => {
	assert.equal(serialize(undefined), "undefined");
	assert.equal(evaluate(serialize(undefined)), undefined);

	const json = {
		foo: undefined,
	};

	assert.equal(serialize(json), '{"foo":undefined}');
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize can handle Infinity and NaN", () => {
	assert.equal(serialize(Number.NEGATIVE_INFINITY), "-Infinity");
	assert.equal(evaluate(serialize(Number.NEGATIVE_INFINITY)), Number.NEGATIVE_INFINITY);
	assert.equal(serialize(Number.POSITIVE_INFINITY), "Infinity");
	assert.equal(evaluate(serialize(Number.POSITIVE_INFINITY)), Number.POSITIVE_INFINITY);

	assert.equal(serialize(Number.NaN), "NaN");
	assert.equal(evaluate(serialize(Number.NaN)), Number.NaN);

	const json = {
		foo: Number.NEGATIVE_INFINITY,
		bar: Number.POSITIVE_INFINITY,
		baz: Number.NaN,
	};

	assert.equal(serialize(json), '{"foo":-Infinity,"bar":Infinity,"baz":NaN}');
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize can handle sparse arrays", () => {
	// biome-ignore lint/suspicious/noSparseArray: ok in test
	const array = [1, , 3, , , 6];
	assert.equal(serialize(array), 'Array.prototype.slice.call({"0":1,"2":3,"5":6,"length":6})');
	assert.deepEqual(evaluate(serialize(array)), array);
});

test("unit/serverData: serialize can handle dates", () => {
	const date = new Date("2024-04-14T23:34:17.156Z");
	assert.equal(serialize(date), 'new Date("2024-04-14T23:34:17.156Z")');
	assert.ok(evaluate(serialize(date)) instanceof Date);
	assert.deepEqual(evaluate(serialize(date)).toISOString(), "2024-04-14T23:34:17.156Z");

	const json = {
		foo: date,
	};

	assert.equal(serialize(json), '{"foo":new Date("2024-04-14T23:34:17.156Z")}');
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize does not interpret string as dates", () => {
	assert.notDeepEqual(
		serialize("2024-04-14T23:34:17.156Z"),
		'new Date("2024-04-14T23:34:17.156Z")',
	);
});

test("unit/serverData: serialize can handle maps", () => {
	const map = new Map(
		/** @type {[import("../../../src/utils/serverData.js").ServerData, import("../../../src/utils/serverData.js").ServerData][]} */ ([
			["foo", "bar"],
			[{ baz: 2 }, "quux"],
		]),
	);
	assert.equal(serialize(map), 'new Map([["foo","bar"],[{"baz":2},"quux"]])');
	assert.ok(evaluate(serialize(map)) instanceof Map);
	assert.deepEqual(evaluate(serialize(map)), map);

	const json = {
		foo: map,
	};

	assert.equal(serialize(json), '{"foo":new Map([["foo","bar"],[{"baz":2},"quux"]])}');
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize can handle sets", () => {
	const set = new Set(
		/** @type {import("../../../src/utils/serverData.js").ServerData[]} */ ([
			"foo",
			{ baz: 2 },
			true,
		]),
	);
	assert.equal(serialize(set), 'new Set(["foo",{"baz":2},true])');
	assert.ok(evaluate(serialize(set)) instanceof Set);
	assert.deepEqual(evaluate(serialize(set)), set);

	const json = {
		foo: set,
	};

	assert.equal(serialize(json), '{"foo":new Set(["foo",{"baz":2},true])}');
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize can handle url", () => {
	const url = new URL("https://test.com/");
	assert.equal(serialize(url), 'new URL("https://test.com/")');
	assert.ok(evaluate(serialize(url)) instanceof URL);
	assert.deepEqual(evaluate(serialize(url)), url);

	const json = {
		foo: url,
	};

	assert.equal(serialize(json), '{"foo":new URL("https://test.com/")}');
	assert.deepEqual(evaluate(serialize(json)), json);
});

test("unit/serverData: serialize handle string looking like placeholders", () => {
	_initGlobalState("123");
	const json = {
		foo: undefined,
		bar: ":123:0:", // matches the placeholder used for `undefined`
	};

	assert.deepEqual(evaluate(serialize(json)), json);
});

/**
 *
 * @param {string} serialized
 * @returns
 */
function evaluate(serialized) {
	// biome-ignore lint/security/noGlobalEval: ok in test
	return eval(`(${serialized});`);
}
