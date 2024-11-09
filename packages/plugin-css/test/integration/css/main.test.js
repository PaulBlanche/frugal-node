import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "@frugal-node/test-utils";
import { css } from "../../../exports/index.js";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/plugin/css: page css order", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["cssOrder/page.ts"],
	}));

	await helper.build();

	const assets = await helper.getAssets("cssOrder/page.ts");
	const cssAssets = assets.get("css");
	const globalCssAssets = cssAssets.filter((asset) => asset.scope === "global");
	const pageCssAssets = cssAssets.filter((asset) => asset.scope === "page");
	assert.equal(globalCssAssets.length, 0, "no global css");
	assert.equal(pageCssAssets.length, 1, "one page css asset");
	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, pageCssAssets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/page.css */
.before {
  color: red;
}
.dep {
  color: orange;
}
.main {
  color: yellow;
}
.after {
  color: blue;
}
/*# sourceMappingURL=page.css.map */
`,
	);
});

test("inte/plugin/css: one css bundle per page, one bundle per global css", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		plugins: [
			css({
				globalCss: [
					"oneBundlePerPage/global1/global1.css",
					"oneBundlePerPage/global2/global2.css",
				],
				esbuildOptions: {
					// disable hash in files to avoid test failure on different
					// environment with different hash seed
					chunkNames: "[dir]/[name]",
					entryNames: "[dir]/[name]",
					assetNames: "[dir]/[name]",
				},
			}),
		],
	}));

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

	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, globalePage1Assets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/global1-17HAOZG.css */
.global1 {
  color: purple;
}
/*# sourceMappingURL=global1.css.map */
`,
	);
	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, globalePage1Assets[1].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/global2-1WMA4DO.css */
.global2 {
  color: yellow;
}
/*# sourceMappingURL=global2.css.map */
`,
	);
	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, pagePage1Assets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/page1.css */
.common {
  color: orange;
}
.page1 {
  color: blue;
}
/*# sourceMappingURL=page1.css.map */
`,
	);
	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, pagePage2Assets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/page2.css */
.common {
  color: orange;
}
.page2 {
  color: green;
}
/*# sourceMappingURL=page2.css.map */
`,
	);
});

test("inte/plugin/css: one single bundle in site mode", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		plugins: [
			css({
				scope: "global",
				globalCss: [
					"oneBundlePerPage/global1/global1.css",
					"oneBundlePerPage/global2/global2.css",
				],
				esbuildOptions: {
					// disable hash in files to avoid test failure on different
					// environment with different hash seed
					chunkNames: "[dir]/[name]",
					entryNames: "[dir]/[name]",
					assetNames: "[dir]/[name]",
				},
			}),
		],
	}));

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

	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, globalePage1Assets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/global1-17HAOZG.css */
.global1 {
  color: purple;
}

/* dist/.temp/build/global2-1WMA4DO.css */
.global2 {
  color: yellow;
}

/* dist/.temp/build/page1.css */
.common {
  color: orange;
}
.page1 {
  color: blue;
}

/* dist/.temp/build/page2.css */
.common {
  color: orange;
}
.page2 {
  color: green;
}

/* global-facade.css */
/*# sourceMappingURL=stdin.css.map */
`,
	);
});

test("inte/plugin/css: esbuild options (minify)", async (context) => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["oneBundlePerPage/page1.ts", "oneBundlePerPage/page2.ts"],
		plugins: [
			css({
				scope: "global",
				esbuildOptions: {
					minify: true,
					// disable hash in files to avoid test failure on different
					// environment with different hash seed
					chunkNames: "[dir]/[name]",
					entryNames: "[dir]/[name]",
					assetNames: "[dir]/[name]",
				},
			}),
		],
	}));

	// since we rebuild pages that were built in previous tests, we clean the
	// outdir to remove any cache (and avoid testing against results of previous tests)
	await helper.clean();

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

	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, globalePage1Assets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`.page1{color:#00f}.common{color:orange}.page2{color:green}
/*# sourceMappingURL=stdin.css.map */
`,
	);
});
