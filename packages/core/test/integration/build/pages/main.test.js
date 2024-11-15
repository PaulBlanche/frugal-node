import * as assert from "node:assert/strict";
import { test } from "node:test";
import { BuildHelper } from "@frugal-node/test-utils";
import { BuildConfigError } from "../../../../exports/config/build.js";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/build/pages: build with no pages", async () => {
	await baseHelper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	cacheExplorer.assertContent({});
});

test("inte/build/pages: build with page that do not exists", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./page-that-do-not-exists.ts"],
	}));

	await assert.rejects(
		async () => {
			await helper.build();
		},
		(error) => {
			assert.ok(error instanceof BuildConfigError);
			assert.strictEqual(error.message, 'Page module "page-that-do-not-exists.ts" not found');
			return true;
		},
	);
});

test("inte/build/pages: build with trivial static page", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./trivialPage.ts"],
	}));
	await helper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	await cacheExplorer.assertContent({
		"/": {
			path: "/",
			body: "Hello world",
			headers: [],
			status: 200,
		},
	});
});

test("inte/build/pages: build with trivial static page with build", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./trivialPageWithBuild.ts"],
	}));
	await helper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	await cacheExplorer.assertContent({
		"/": {
			path: "/",
			body: "bar",
			headers: [["my-header", "quux"]],
			status: 204,
		},
	});
});

test("inte/build/pages: build with trivial static page with getBuildPath", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./trivialPageWithGetBuildPath.ts"],
	}));
	await helper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	await cacheExplorer.assertContent({
		"/foo/baz": {
			path: "/foo/baz",
			body: "baz",
			headers: [],
			status: 200,
		},
		"/foo/quux": {
			path: "/foo/quux",
			body: "quux",
			headers: [],
			status: 200,
		},
	});
});

test("inte/build/pages: build with complete static page", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./completePage.ts"],
	}));
	await helper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	await cacheExplorer.assertContent({
		"/bar": {
			path: "/bar",
			body: "Hello bar",
			headers: [["my-header-bar", "bar"]],
			status: 201,
		},
		"/quux": {
			path: "/quux",
			body: "Hello quux",
			headers: [["my-header-quux", "quux"]],
			status: 405,
		},
	});
});

test("inte/build/pages: build dynamic page", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./dynamicPage.ts"],
	}));
	await helper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	cacheExplorer.assertContent({});
});

test("inte/build/pages: build static page with empty response", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./pageWithEmptyResponse.ts"],
	}));
	await helper.build();

	const cacheExplorer = await baseHelper.getCacheExplorer();
	await cacheExplorer.assertContent({
		"/": {
			path: "/",
			headers: [["my-header", "quux"]],
			status: 204,
			body: undefined,
		},
	});
});
