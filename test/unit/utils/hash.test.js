import * as assert from "node:assert/strict";
import { test } from "node:test";
import * as xxhash from "@node-rs/xxhash";
import * as hash from "../../../src/utils/hash.js";

test("utils/hash.js: hash string", () => {
	const string = "foo";
	assert.strictEqual(
		hash.create().update(string).digest(),
		new xxhash.Xxh64().update(string).digest().toString(36).toUpperCase(),
	);
});

test("utils/hash.js: hash Uint8Array", () => {
	const array = new Uint8Array([1, 2, 3]);
	assert.strictEqual(
		hash.create().update(array).digest(),
		new xxhash.Xxh64().update(Buffer.from(array)).digest().toString(36).toUpperCase(),
	);
});

test("utils/hash.js: hash multiple", () => {
	const string = "foo";
	const array = new Uint8Array([1, 2, 3]);
	assert.strictEqual(
		hash.create().update(array).update(string).digest(),
		new xxhash.Xxh64()
			.update(Buffer.from(array))
			.update(string)
			.digest()
			.toString(36)
			.toUpperCase(),
	);
});
