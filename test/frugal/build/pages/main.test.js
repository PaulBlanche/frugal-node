import * as assert from "node:assert/strict";
import { test } from "node:test";
import { ConfigError } from "../../../../packages/frugal/src/Config.js";
import { BuildHelper } from "../../../utils/BuildHelper.js";

const baseHelper = await BuildHelper.setup(import.meta.dirname);

test("inte/frugal/build/pages: build with no pages", async () => {
	const helper = baseHelper.extends({ global: { pages: [] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({});
});

test("inte/frugal/build/pages: build with page that do not exists", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./page-that-do-not-exists.ts"] } });

	await assert.rejects(
		async () => {
			return await helper.build();
		},
		(error) => {
			assert.ok(error instanceof ConfigError);
			assert.strictEqual(error.message, 'Page module "page-that-do-not-exists.ts" not found');
			return true;
		},
	);
});

test("inte/frugal/build/pages: build with trivial static page", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./trivialPage.ts"] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({
		"/": {
			path: "/",
			body: "Hello world",
			headers: [],
			age: "new",
			status: 200,
		},
	});
});

test("inte/frugal/build/pages: build with trivial static page with build", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./trivialPageWithBuild.ts"] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({
		"/": {
			path: "/",
			body: "bar",
			headers: [["my-header", "quux"]],
			age: "new",
			status: 204,
		},
	});
});

test("inte/frugal/build/pages: build with trivial static page with getBuildPath", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./trivialPageWithGetBuildPath.ts"] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({
		"/foo/baz": {
			path: "/foo/baz",
			body: "baz",
			headers: [],
			age: "new",
			status: 200,
		},
		"/foo/quux": {
			path: "/foo/quux",
			body: "quux",
			headers: [],
			age: "new",
			status: 200,
		},
	});
});

test("inte/frugal/build/pages: build with complete static page", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./completePage.ts"] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({
		"/bar": {
			path: "/bar",
			body: "Hello bar",
			headers: [["my-header-bar", "bar"]],
			age: "new",
			status: 201,
		},
		"/quux": {
			path: "/quux",
			body: "Hello quux",
			headers: [["my-header-quux", "quux"]],
			age: "new",
			status: 405,
		},
	});
});

test("inte/frugal/build/pages: build dynamic page", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./dynamicPage.ts"] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({});
});

test("inte/frugal/build/pages: build static page with empty response", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./pageWithEmptyResponse.ts"] } });
	await helper.build();

	const cache = await helper.getCache();
	await cache.assertContent({
		"/": {
			path: "/",
			headers: [["my-header", "quux"]],
			age: "new",
			status: 204,
			body: undefined,
		},
	});
});
