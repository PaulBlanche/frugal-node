/** @import { SerializedFrugalResponse, FrugalResponse } from "../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { mockFs } from "@frugal-node/test-utils";

const fsMockContext = mock.module(new URL("../../../src/utils/fs.js", import.meta.url).toString(), {
	namedExports: mockFs.MOCK_FS,
});

// use a hash to ensure getting a new instance of the module, that will be instanciated using the previously mocked module
const { BuildCache, loadData } = /** @type {typeof import('../../../src/build/BuildCache.js')} */ (
	await import(`../../../src/build/BuildCache.js#${Math.random()}`)
);

await test("unit/BuildCache: response not in cache is generated", async (context) => {
	mockFs.emptyMockFs();

	/** @type {SerializedFrugalResponse} */
	const serializedResponse = {
		path: "/1",
		hash: "hash",
		body: "body",
		headers: [["foo", "bar"]],
		status: 205,
	};

	const serializeSpy = mock.fn(() => serializedResponse);
	/** @type {FrugalResponse} */
	const response = {
		...serializedResponse,
		body: "body",
		headers: new Headers(serializedResponse.headers),
		serialize: serializeSpy,
	};

	mockFs.MOCK_FS.writeTextFile("/cache.json", JSON.stringify({ current: {} }));

	const cache = await BuildCache.load({ dir: "/" });
	await cache.add(response);
	await cache.save();

	const cacheData = (await loadData({ dir: "/" })) ?? {
		current: {},
		previous: {},
	};

	assert.equal(serializeSpy.mock.callCount(), 1);
	assert.deepEqual(cacheData?.current["/1"], {
		path: serializedResponse.path,
		hash: serializedResponse.hash,
		headers: serializedResponse.headers,
		status: serializedResponse.status,
		file: "body_ZD8VTM",
		age: "new",
	});
});

await test("unit/BuildCache: response with same hash already in cache is not regenerated", async () => {
	mockFs.emptyMockFs();

	/** @type {SerializedFrugalResponse} */
	const serializedResponse = {
		path: "/1",
		hash: "hash",
		body: "body",
		headers: [["foo", "bar"]],
		status: 205,
	};
	const cacheEntry = {
		path: serializedResponse.path,
		hash: serializedResponse.hash,
		headers: serializedResponse.headers,
		status: serializedResponse.status,
		file: "body_ZD8VTM",
		age: "new",
	};
	const serializeSpy = mock.fn(() => serializedResponse);
	/** @type {FrugalResponse} */
	const response = {
		...serializedResponse,
		body: "body",
		headers: new Headers(serializedResponse.headers),
		serialize: serializeSpy,
	};

	mockFs.MOCK_FS.writeTextFile(
		"/cache.json",
		JSON.stringify({ current: { [cacheEntry.path]: cacheEntry } }),
	);

	const cache = await BuildCache.load({ dir: "/" });
	await cache.add(response);
	await cache.save();

	const cacheData = (await loadData({ dir: "/" })) ?? {
		current: {},
		previous: {},
	};

	assert.equal(serializeSpy.mock.callCount(), 0);
	assert.deepEqual(cacheData?.current["/1"], {
		...cacheEntry,
		age: "old",
	});
});

await test("unit/BuildCache: response with different hash already in cache is regenerated", async () => {
	mockFs.emptyMockFs();

	/** @type {SerializedFrugalResponse} */
	const serializedResponse = {
		path: "/1",
		hash: "new-hash",
		body: "body",
		headers: [["foo", "bar"]],
		status: 205,
	};
	const cacheEntry = {
		path: serializedResponse.path,
		hash: "old-hash",
		headers: serializedResponse.headers,
		status: serializedResponse.status,
		file: "body_ZD8VTM",
		age: "new",
	};
	const serializeSpy = mock.fn(() => serializedResponse);
	/** @type {FrugalResponse} */
	const response = {
		...serializedResponse,
		body: "body",
		headers: new Headers(serializedResponse.headers),
		serialize: serializeSpy,
	};

	mockFs.MOCK_FS.writeTextFile(
		"/cache.json",
		JSON.stringify({ current: { [cacheEntry.path]: cacheEntry } }),
	);

	const cache = await BuildCache.load({ dir: "/" });
	await cache.add(response);
	await cache.save();

	const cacheData = (await loadData({ dir: "/" })) ?? {
		current: {},
		previous: {},
	};

	assert.equal(serializeSpy.mock.callCount(), 1);
	assert.deepEqual(cacheData?.current["/1"], {
		path: serializedResponse.path,
		hash: serializedResponse.hash,
		headers: serializedResponse.headers,
		status: serializedResponse.status,
		file: "body_ZD8VTM",
		age: "new",
	});
});

fsMockContext.restore();
