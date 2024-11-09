import * as assert from "node:assert/strict";
import { test } from "node:test";
import { debounce } from "../../../src/utils/asyncIterator.js";

test("unit/asyncIterator: debounce", async () => {
	const groups = [];
	for await (const debouncedEvents of debounce(
		every([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], 20),
		200,
	)) {
		groups.push(debouncedEvents);
	}

	assert.deepEqual(groups, [[1], [2, 3, 4, 5, 6, 7, 8, 9, 10], [11, 12, 13]]);
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
