import * as assert from "node:assert";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { css } from "../../../../../plugins/css/index.js";
import { BuildHelper } from "../../../../utils/BuildHelper.js";
import { loadFixtureConfig, setupFixtures } from "../../../../utils/fixtures.js";
import { init } from "../../../../utils/snapshot.js";

const snapshot = await init(import.meta.url);

await setupFixtures(import.meta.dirname);
const config = await loadFixtureConfig(import.meta.dirname);
const helper = new BuildHelper(config);

// css order in page mode
// a css bundle per page in page mode
// css order (page/global) in site mode + 1 single bundle
// esbuild options (minify)
// cssModules

test("integration/build/plugin/css: page css order", async (context) => {
	await helper.build({ pages: ["cssOrder/page.ts"] });

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
	await helper.build({
		pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		plugins: [
			css({ globalCss: ["oneBundlePerPage/global1.css", "oneBundlePerPage/global2.css"] }),
		],
	});

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
	await helper.build({
		pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		plugins: [
			css({
				scope: "global",
				globalCss: ["oneBundlePerPage/global1.css", "oneBundlePerPage/global2.css"],
			}),
		],
	});

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
	await helper.build({
		pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		plugins: [
			css({
				scope: "global",
				esbuildOptions: { minify: true },
				globalCss: ["oneBundlePerPage/global1.css", "oneBundlePerPage/global2.css"],
			}),
		],
	});

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
	await helper.build({
		pages: ["cssModules/page.ts"],
		plugins: [
			css({
				cssModule: {
					// to avoid hash beeing different on different machines runing the
					// tests
					pattern: "[local]",
				},
			}),
		],
	});

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

	snapshot.assert(context, await cache.get("/page"), "bundle with css module class");
});
