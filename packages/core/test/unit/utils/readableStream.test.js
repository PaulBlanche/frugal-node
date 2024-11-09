import * as assert from "node:assert/strict";
import * as webStream from "node:stream/web";
import { test } from "node:test";

import * as readableStream from "../../../src/utils/readableStream.js";

test("unit/readableStream.js: read binary stream", async () => {
	const stream = /** @type {webStream.ReadableStream<Uint8Array>} */ (
		/** @type {any} */ (webStream.ReadableStream).from([
			new Uint8Array([1]),
			new Uint8Array([2]),
			new Uint8Array([3]),
		])
	);
	assert.deepEqual(await readableStream.readStream(stream), new Uint8Array([1, 2, 3]));
});

test("unit/readableStream.js: text line stream", async () => {
	const stream = /** @type {webStream.ReadableStream<string>} */ (
		/** @type {any} */ (webStream.ReadableStream).from([
			"foo foo\nba",
			"r\nbaz b",
			"az\nquux\nfoobar",
		])
	);

	/** @type {string[]} */
	const lines = [];
	for await (const line of stream.pipeThrough(new readableStream.TextLineStream())) {
		lines.push(line);
	}

	assert.deepEqual(lines, ["foo foo", "bar", "baz baz", "quux", "foobar"]);
});

test("unit/readableStream.js: merge streams", async () => {
	const stream1 = /** @type {webStream.ReadableStream<string>} */ (
		/** @type {any} */ (webStream.ReadableStream).from(
			every(["a1", "b1", "c1", "d1", "e1", "f1"], 450),
		)
	);
	const stream2 = /** @type {webStream.ReadableStream<string>} */ (
		/** @type {any} */ (webStream.ReadableStream).from(
			every(["a2", "b2", "c2", "d2", "e2", "f2"], 280),
		)
	);

	/** @type {string[]} */
	const events = [];
	for await (const event of readableStream.mergeReadableStreams(stream1, stream2)) {
		events.push(event);
	}

	assert.deepEqual(events, [
		"a2",
		"a1",
		"b2",
		"c2",
		"b1",
		"d2",
		"c1",
		"e2",
		"f2",
		"d1",
		"e1",
		"f1",
	]);
});

test("unit/readableStream.js: merge streams with error", async () => {
	const stream1 = /** @type {webStream.ReadableStream<string>} */ (
		/** @type {any} */ (webStream.ReadableStream).from(
			(async function* () {
				yield await new Promise((res) => setTimeout(() => res("a1"), 30));
				yield await new Promise((res) => setTimeout(() => res("b1"), 50));
				yield await new Promise((res) => setTimeout(() => res("c1"), 30));
			})(),
		)
	);
	const error = new Error("my error");
	const stream2 = /** @type {webStream.ReadableStream<string>} */ (
		/** @type {any} */ (webStream.ReadableStream).from(
			(async function* () {
				yield await new Promise((res) => setTimeout(() => res("a2"), 19));
				yield await new Promise((res) => setTimeout(() => res("b2"), 19));
				yield await new Promise((_, rej) => setTimeout(() => rej(error), 19));
			})(),
		)
	);

	/** @type {string[]} */
	const events = [];
	await assert.rejects(async () => {
		for await (const event of readableStream.mergeReadableStreams(stream1, stream2)) {
			events.push(event);
		}
	}, error);

	assert.deepEqual(events, ["a2", "a1", "b2"]);
});

/**
 * @template T
 * @param {T[]} items
 * @param {number} delay
 */
async function* every(items, delay) {
	for (const item of items) {
		yield await new Promise((res) => setTimeout(() => res(item), delay));
	}
}
