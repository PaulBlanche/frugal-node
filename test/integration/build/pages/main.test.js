import * as assert from "node:assert";
import { test } from "node:test";
import * as frugal from "../../../../index.js";
import { ConfigError, FrugalConfig } from "../../../../src/Config.js";
import { BuildHelper } from "../../../utils/BuildHelper.js";
import { loadFixtureConfig, setupFixtures } from "../../../utils/fixtures.js";

await setupFixtures(import.meta.dirname);
const config = await loadFixtureConfig(import.meta.dirname);
const helper = new BuildHelper(config);

test("integration/build/pages: build with no pages", async () => {
	await helper.build({ pages: [] });

	const cache = await helper.getCache();
	await cache.assertContent({});
});

test("integration/build/pages: build with page that do not exists", async () => {
	await assert.rejects(
		async () => {
			return await frugal.build({ ...config, pages: ["./page-that-do-not-exists.ts"] });
		},
		(error) => {
			assert.ok(error instanceof ConfigError);
			assert.strictEqual(error.message, 'Page module "page-that-do-not-exists.ts" not found');
			return true;
		},
	);
});

test("integration/build/pages: build with trivial static page", async () => {
	await helper.build({ pages: ["./trivialPage.ts"] });

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

test("integration/build/pages: build with trivial static page with build", async () => {
	await helper.build({ pages: ["./trivialPageWithBuild.ts"] });

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

test("integration/build/pages: build with trivial static page with getBuildPath", async () => {
	await helper.build({ pages: ["./trivialPageWithGetBuildPath.ts"] });

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

test("integration/build/pages: build with complete static page", async () => {
	await helper.build({ pages: ["./completePage.ts"] });

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

test("integration/build/pages: build dynamic page", async () => {
	await helper.build({ pages: ["./dynamicPage.ts"] });

	const cache = await helper.getCache();
	await cache.assertContent({});
});

test("integration/build/pages: build static page with empty response", async () => {
	await helper.build({ pages: ["./pageWithEmptyResponse.ts"] });

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
