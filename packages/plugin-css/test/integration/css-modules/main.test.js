import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "@frugal-node/test-utils";
import { css } from "../../../exports/index.js";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/plugin/css: css modules", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["cssModules/page.ts"],
		plugins: [
			css({
				cssModule: {
					// disable hash in selectors to avoid test failure on
					// different environment with different hash seed
					pattern: "[local]",
				},
				esbuildOptions: {
					// disable hash in files to avoid test failure on different
					// environment with different hash seed
					chunkNames: "[dir]/[name]",
					entryNames: "[dir]/[name]",
					assetNames: "[dir]/[name]",
					minify: false,
				},
			}),
		],
	}));

	await helper.build();

	const page1Assets = (await helper.getAssets("cssModules/page.ts")).get("css");
	const globalePage1Assets = page1Assets.filter((asset) => asset.scope === "global");
	const pagePage1Assets = page1Assets.filter((asset) => asset.scope === "page");

	assert.strictEqual(globalePage1Assets.length, 0, "no global css");
	assert.strictEqual(pagePage1Assets.length, 1, " one page css");

	assert.equal(
		await fs.promises.readFile(
			path.join(helper.internalBuildConfig.publicDir, pagePage1Assets[0].path),
			{
				encoding: "utf-8",
			},
		),
		`/* dist/.temp/build/page.css */
.base-dep {
  color: #ff0;
}
.local-dep {
  color: orange;
}
.page {
  color: #00f;
}
.foo-bar {
  color: green;
}
.global-selector {
  color: violet;
}
`,
	);

	const cache = await helper.getCacheExplorer();

	const entry = await cache.get("/page");
	assert.equal(
		entry.body,
		'{"fooBar":"foo-bar base-dep local-dep","page":"page foo-bar base-dep local-dep global-selector"}',
	);
});
