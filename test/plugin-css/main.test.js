import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { css } from "../../packages/plugin-css/exports/index.js";
import { BuildHelper } from "../utils/BuildHelper.js";
import { init } from "../utils/snapshot.js";

const snapshot = await init(import.meta.url);
const baseHelper = await BuildHelper.setup(import.meta.dirname);

test("integration/build/plugin/css: page css order", async (context) => {
	const helper = baseHelper.extends({ global: { pages: ["cssOrder/page.ts"] } });
	await helper.build();

	const assets = await helper.getAssets("cssOrder/page.ts");
	const cssAssets = assets.get("css");
	const globalCssAssets = cssAssets.filter((asset) => asset.scope === "global");
	const pageCssAssets = cssAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(globalCssAssets.length, 0, "no global css");
	assert.strictEqual(pageCssAssets.length, 1, "one page css asset");
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, pageCssAssets[0].path), {
			encoding: "utf-8",
		}),
		"css should be bundle in a specific order",
	);
});

test("integration/build/plugin/css: one css bundle per page, one bundle per global css", async (context) => {
	const helper = baseHelper.extends({
		global: {
			pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		},
		build: {
			plugins: [
				css({
					globalCss: ["oneBundlePerPage/global1.css", "oneBundlePerPage/global2.css"],
				}),
			],
		},
	});
	await helper.build();

	const page1Assets = (await helper.getAssets("oneBundlePerPage/page1.ts")).get("css");
	const globalePage1Assets = page1Assets.filter((asset) => asset.scope === "global");
	const pagePage1Assets = page1Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage1Assets.length, 2, "two global css");
	assert.strictEqual(pagePage1Assets.length, 1, "one page css");

	const page2Assets = (await helper.getAssets("oneBundlePerPage/page2.ts")).get("css");
	const globalePage2Assets = page2Assets.filter((asset) => asset.scope === "global");
	const pagePage2Assets = page2Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage2Assets.length, 2, "two global css");
	assert.strictEqual(pagePage2Assets.length, 1, "one page css");

	assert.deepStrictEqual(
		globalePage1Assets,
		globalePage2Assets,
		"global css bundles should be the same for both pages",
	);

	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, globalePage1Assets[0].path), {
			encoding: "utf-8",
		}),
		"global css bundle 1",
	);
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, globalePage1Assets[1].path), {
			encoding: "utf-8",
		}),
		"global css bundle 2",
	);
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, pagePage1Assets[0].path), {
			encoding: "utf-8",
		}),
		"page css bundle for page 1",
	);
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, pagePage2Assets[0].path), {
			encoding: "utf-8",
		}),
		"page css bundle for page 1",
	);
});

test("integration/build/plugin/css: one single bundle in site mode", async (context) => {
	const helper = baseHelper.extends({
		global: {
			pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		},
		build: {
			plugins: [
				css({
					scope: "global",
					globalCss: ["oneBundlePerPage/global1.css", "oneBundlePerPage/global2.css"],
				}),
			],
		},
	});
	await helper.build();

	const page1Assets = (await helper.getAssets("oneBundlePerPage/page1.ts")).get("css");
	const globalePage1Assets = page1Assets.filter((asset) => asset.scope === "global");
	const pagePage1Assets = page1Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage1Assets.length, 1, "one global css");
	assert.strictEqual(pagePage1Assets.length, 0, " no page css");

	const page2Assets = (await helper.getAssets("oneBundlePerPage/page2.ts")).get("css");
	const globalePage2Assets = page2Assets.filter((asset) => asset.scope === "global");
	const pagePage2Assets = page2Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage2Assets.length, 1, "one global css");
	assert.strictEqual(pagePage2Assets.length, 0, " no page css");

	assert.deepStrictEqual(
		globalePage1Assets,
		globalePage2Assets,
		"global css bundles should be the same for both pages",
	);

	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, globalePage1Assets[0].path), {
			encoding: "utf-8",
		}),
		"global css bundle",
	);
});

test("integration/build/plugin/css: esbuild options (minify)", async (context) => {
	const helper = baseHelper.extends({
		global: {
			pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		},
		build: {
			plugins: [
				css({
					scope: "global",
					esbuildOptions: { minify: true },
					globalCss: ["oneBundlePerPage/global1.css", "oneBundlePerPage/global2.css"],
				}),
			],
		},
	});
	await helper.build();

	const page1Assets = (await helper.getAssets("oneBundlePerPage/page1.ts")).get("css");
	const globalePage1Assets = page1Assets.filter((asset) => asset.scope === "global");
	const pagePage1Assets = page1Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage1Assets.length, 1, "one global css");
	assert.strictEqual(pagePage1Assets.length, 0, " no page css");

	const page2Assets = (await helper.getAssets("oneBundlePerPage/page2.ts")).get("css");
	const globalePage2Assets = page2Assets.filter((asset) => asset.scope === "global");
	const pagePage2Assets = page2Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage2Assets.length, 1, "one global css");
	assert.strictEqual(pagePage2Assets.length, 0, " no page css");

	assert.deepStrictEqual(
		globalePage1Assets,
		globalePage2Assets,
		"global css bundles should be the same for both pages",
	);

	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, globalePage1Assets[0].path), {
			encoding: "utf-8",
		}),
		"global css bundle minified",
	);
});

test("integration/build/plugin/css: css modules", async (context) => {
	const helper = baseHelper.extends({
		global: {
			pages: ["cssModules/page.ts"],
		},
		build: {
			plugins: [
				css({
					cssModule: {
						// to avoid hash beeing different on different machines runing the
						// tests
						pattern: "[local]",
					},
				}),
			],
		},
	});
	await helper.build();

	const page1Assets = (await helper.getAssets("cssModules/page.ts")).get("css");
	const globalePage1Assets = page1Assets.filter((asset) => asset.scope === "global");
	const pagePage1Assets = page1Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage1Assets.length, 0, "no global css");
	assert.strictEqual(pagePage1Assets.length, 1, " one page css");

	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, pagePage1Assets[0].path), {
			encoding: "utf-8",
		}),
		"css module compiled",
	);

	const cache = await helper.getCache();

	const entry = await cache.get("/page");
	snapshot.assert(
		context,
		{
			...entry,
			headers: [],
		},
		"bundle with css module class",
	);
});
