import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { css } from "../../packages/plugin-css/exports/index.js";
import { script } from "../../packages/plugin-script/exports/index.js";
import { BuildHelper } from "../utils/BuildHelper.js";
import { init } from "../utils/snapshot.js";

const snapshot = await init(import.meta.url);
const baseHelper = await BuildHelper.setup(import.meta.dirname);

test("integration/build/plugin/script: page script order", async (context) => {
	const helper = baseHelper.extends({ pages: ["scriptOrder/page1.ts", "scriptOrder/page2.ts"] });
	await helper.build();

	const page1Assets = await helper.getAssets("scriptOrder/page1.ts");
	const page1JsAssets = page1Assets.get("js");
	const page1PageJsAssets = page1JsAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(page1PageJsAssets.length, 1, "one page js asset");
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, page1PageJsAssets[0].path), {
			encoding: "utf-8",
		}),
		"js should be bundle in a specific order",
	);

	const page2Assets = await helper.getAssets("scriptOrder/page2.ts");
	const page2JsAssets = page2Assets.get("js");
	const page2PageJsAssets = page2JsAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(page2PageJsAssets.length, 1, "one page js asset");
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, page2PageJsAssets[0].path), {
			encoding: "utf-8",
		}),
		"js should be bundle in a specific order",
	);
});

test("integration/build/plugin/script: import.meta.environment", async () => {
	const helper = baseHelper.extends({ pages: ["importMetaEnvironment/page.ts"] });
	await helper.build();

	const assets = await helper.getAssets("importMetaEnvironment/page.ts");
	const jsAssets = assets.get("js");
	const pageJsAssets = jsAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(pageJsAssets.length, 1, "one page js asset");

	const originalLog = console.log;
	console.log = (message) => {
		assert.strictEqual(
			message,
			"client",
			'import.meta.environment should be "client" in bundled scripts',
		);
	};
	await import(path.join(helper.config.publicDir, pageJsAssets[0].path));
	console.log = originalLog;
});

test("integration/build/plugin/script: interaction with css modules", async (context) => {
	const helper = baseHelper.extends({
		pages: ["cssModules/page.ts"],
		plugins: [script(), css({ cssModule: true })],
	});
	await helper.build();

	const assets = await helper.getAssets("cssModules/page.ts");
	const jsAssets = assets.get("js");
	const pageJsAssets = jsAssets.filter((asset) => asset.scope === "page");
	const cssAssets = assets.get("css");
	const pageCssAssets = cssAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(pageJsAssets.length, 1, "one page js asset");
	assert.strictEqual(pageCssAssets.length, 1, "one page css asset");

	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, pageJsAssets[0].path), {
			encoding: "utf-8",
		}),
		"js should be bundle in a specific order",
	);
	snapshot.assert(
		context,
		await fs.promises.readFile(path.join(helper.config.publicDir, pageCssAssets[0].path), {
			encoding: "utf-8",
		}),
		"css should be bundle in a specific order",
	);
});
