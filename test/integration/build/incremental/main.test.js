import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import * as frugal from "../../../../index.js";
import { FrugalConfig } from "../../../../src/Config.js";
import { BuildHelper } from "../../../utils/BuildHelper.js";
import { loadFixtureConfig, setupFixtures } from "../../../utils/fixtures.js";

await setupFixtures(import.meta.dirname);
const config = await loadFixtureConfig(import.meta.dirname);
const helper = new BuildHelper(config);

test("integration/build/incremental: files are not changed is nothing changed", async () => {
	await helper.build();
	const firstBuildCache = await helper.getCache();
	firstBuildCache.assertPathAge("/page1/1", "new");
	firstBuildCache.assertPathAge("/page1/2", "new");
	firstBuildCache.assertPathAge("/page2/1", "new");
	firstBuildCache.assertPathAge("/page2/2", "new");

	await frugal.build(config);
	const secondBuildCache = await helper.getCache();
	secondBuildCache.assertPathAge("/page1/1", "old");
	secondBuildCache.assertPathAge("/page1/2", "old");
	secondBuildCache.assertPathAge("/page2/1", "old");
	secondBuildCache.assertPathAge("/page2/2", "old");
});

test("integration/build/incremental: files regenerated if page code changes", async () => {
	await helper.build();

	// add comment at the top of page1.ts
	const modulePath = path.resolve(import.meta.dirname, "project/page1.ts");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	await fs.promises.writeFile(modulePath, `//comment\n${originalData}`, { encoding: "utf-8" });

	await helper.build();
	const cache = await helper.getCache();
	cache.assertPathAge("/page1/1", "new");
	cache.assertPathAge("/page1/2", "new");
	cache.assertPathAge("/page2/1", "old");
	cache.assertPathAge("/page2/2", "old");
});

test("integration/build/incremental: files regenerated if dependency code changes", async () => {
	await helper.build();

	// add comment at the top of store.ts
	const modulePath = path.resolve(import.meta.dirname, "project/store.ts");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	await fs.promises.writeFile(modulePath, `//comment\n${originalData}`, { encoding: "utf-8" });

	await helper.build();
	const cache = await helper.getCache();
	cache.assertPathAge("/page1/1", "new");
	cache.assertPathAge("/page1/2", "new");
	cache.assertPathAge("/page2/1", "new");
	cache.assertPathAge("/page2/2", "new");
});

test("integration/build/incremental: files regenerated if data changes", async () => {
	await helper.build();

	// modifydata.json but only data used by page1/1
	const modulePath = path.resolve(import.meta.dirname, "project/data.json");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	const updatedData = JSON.parse(originalData);
	updatedData[0]["1"] = { data: 110 };
	await fs.promises.writeFile(modulePath, JSON.stringify(updatedData, null, 4), {
		encoding: "utf-8",
	});

	await helper.build();
	const cache = await helper.getCache();
	cache.assertPathAge("/page1/1", "new");
	cache.assertPathAge("/page1/2", "old");
	cache.assertPathAge("/page2/1", "old");
	cache.assertPathAge("/page2/2", "old");
});
