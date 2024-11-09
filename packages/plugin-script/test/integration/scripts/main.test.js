import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { mock, test } from "node:test";
import { BuildConfig } from "@frugal-node/core/config/build";
import { PageAssets } from "@frugal-node/core/page";
import { BuildHelper } from "@frugal-node/test-utils";
import { build } from "../../../../frugal/src/build/build.js";
import { loadManifest } from "../../../../frugal/src/build/manifest.js";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/plugin/script: page script bundle order", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["scriptOrder/page1.ts", "scriptOrder/page2.ts"],
	}));
	await helper.build();

	const logMock = mock.fn();
	console.log = logMock;

	const page1Assets = await helper.getAssets("scriptOrder/page1.ts");
	const page1JsAssets = page1Assets.get("js");
	const page1PageJsAssets = page1JsAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(page1PageJsAssets.length, 1, "one page js asset");
	// we would expect "before.script.ts" first, but there is a known "bug" in
	// esbuild relative to import ordering when code splitting :
	// https://github.com/evanw/esbuild/issues/399. Therefore every module that
	// is pulled in a common chunk ("zod", "dep1" and "dep2") is imported and
	// executd first, and the inlined code in the entrypoint is executed second
	// ("before" and "after")
	await import(path.join(helper.internalBuildConfig.publicDir, page1PageJsAssets[0].path));
	assert.deepEqual(
		logMock.mock.calls.map((call) => call.arguments),
		[
			["zod"],
			["dep1.script.ts"],
			["dep2.script.ts"],
			["before.script.ts"],
			["after.script.ts"],
		],
	);
	logMock.mock.resetCalls();
	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, page1PageJsAssets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`import "./chunk.js";

// scriptOrder/0-before.script.ts
if (true) {
  console.log("before.script.ts");
}

// scriptOrder/2-after.script.ts
if (true) {
  console.log("after.script.ts");
}
//# sourceMappingURL=page1.js.map
`,
	);

	const page2Assets = await helper.getAssets("scriptOrder/page2.ts");
	const page2JsAssets = page2Assets.get("js");
	const page2PageJsAssets = page2JsAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(page2PageJsAssets.length, 1, "one page js asset");

	// the common chunk was already initialized during the previous import, therefore nothing is outputed here
	await import(path.join(helper.internalBuildConfig.publicDir, page2PageJsAssets[0].path));
	assert.deepEqual(
		logMock.mock.calls.map((call) => call.arguments),
		[],
	);
	logMock.mock.resetCalls();
	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, page2PageJsAssets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`import "./chunk.js";
//# sourceMappingURL=page2.js.map
`,
	);

	logMock.mock.restore();
});

test("inte/plugin/script: import.meta.environment", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["importMetaEnvironment/page.ts"],
	}));
	await helper.build();

	const logMock = mock.fn();
	console.log = logMock;

	const pageAsets = await helper.getAssets("importMetaEnvironment/page.ts");
	const jsAssets = pageAsets.get("js");
	const pageJsAssets = jsAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(pageJsAssets.length, 1, "one page js asset");

	await import(path.join(helper.internalBuildConfig.publicDir, pageJsAssets[0].path));
	assert.deepEqual(
		logMock.mock.calls.map((call) => call.arguments),
		[["client"]],
	);

	logMock.mock.restore();
});
