import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "@frugal-node/test-utils";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/plugin/script: interaction with css-modules", async (context) => {
	await baseHelper.build();

	const assets = await baseHelper.getAssets("cssModules/page.ts");
	const jsAssets = assets.get("js");
	const pageJsAssets = jsAssets.filter((asset) => asset.scope === "page");
	const cssAssets = assets.get("css");
	const pageCssAssets = cssAssets.filter((asset) => asset.scope === "page");
	assert.strictEqual(pageJsAssets.length, 1, "one page js asset");
	assert.strictEqual(pageCssAssets.length, 1, "one page css asset");

	assert.equal(
		await fs.promises.readFile(
			path.join(baseHelper.internalBuildConfig.publicDir, pageJsAssets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`// cssModuleHelper:format.js
function format(...classNames) {
  const list = classNames.flatMap((name) => name.split(" "));
  return [...new Set(list)].join(" ");
}

// cssModules/main.module.css
var foo = format("CBGdRa_foo");

// cssModules/main.script.ts
globalThis.foo = foo;
//# sourceMappingURL=page.js.map
`,
	);
	assert.equal(
		await fs.promises.readFile(
			path.join(baseHelper.internalBuildConfig.publicDir, pageCssAssets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/page.css */
.CBGdRa_foo {
  color: red;
}
/*# sourceMappingURL=page.css.map */
`,
	);
});
