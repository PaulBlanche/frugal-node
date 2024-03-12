import * as assert from "node:assert/strict";
import { test } from "node:test";
import murmur from "imurmurhash";
import { Hash } from "../../../packages/frugal/src/utils/Hash.js";

test("unit/frugal/utils/hash.js: hash string", () => {
	const string = "foo";
	assert.strictEqual(
		Hash.create().update(string).digest(),
		new murmur().hash(string).result().toString(36).toUpperCase(),
	);
});

test("unit/frugal/utils/hash.js: hash Uint8Array", () => {
	const array = new Uint8Array([1, 2, 3]);
	assert.strictEqual(
		Hash.create().update(array).digest(),
		new murmur().hash(new TextDecoder().decode(array)).result().toString(36).toUpperCase(),
	);
});

test("unit/frugal/utils/hash.js: hash multiple", () => {
	const string = "foo";
	const array = new Uint8Array([1, 2, 3]);
	assert.strictEqual(
		Hash.create().update(array).update(string).digest(),
		new murmur()
			.hash(new TextDecoder().decode(array))
			.hash(string)
			.result()
			.toString(36)
			.toUpperCase(),
	);
});
