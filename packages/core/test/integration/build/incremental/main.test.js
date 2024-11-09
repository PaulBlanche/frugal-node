import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "@frugal-node/test-utils";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/build/incremental: files are not changed if nothing changed", async () => {
	await baseHelper.build();
	const firstBuildCache = await baseHelper.getCacheExplorer();

	firstBuildCache.assertPathAge("/page1/1", "new");
	firstBuildCache.assertPathAge("/page1/2", "new");
	firstBuildCache.assertPathAge("/page2/1", "new");
	firstBuildCache.assertPathAge("/page2/2", "new");

	await baseHelper.build();
	const secondBuildCache = await baseHelper.getCacheExplorer();

	secondBuildCache.assertPathAge("/page1/1", "old");
	secondBuildCache.assertPathAge("/page1/2", "old");
	secondBuildCache.assertPathAge("/page2/1", "old");
	secondBuildCache.assertPathAge("/page2/2", "old");
});

test("inte/build/incremental: files are regenerated if page code changes", async () => {
	await baseHelper.build();

	// add comment at the top of page1.ts => page1/1 and page1/2 are regenerated
	const modulePath = path.resolve(import.meta.dirname, "project/page1.ts");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	await fs.promises.writeFile(modulePath, `//comment\n${originalData}`, { encoding: "utf-8" });

	await baseHelper.build();
	const cache = await baseHelper.getCacheExplorer();

	cache.assertPathAge("/page1/1", "new");
	cache.assertPathAge("/page1/2", "new");
	cache.assertPathAge("/page2/1", "old");
	cache.assertPathAge("/page2/2", "old");
});

test("inte/build/incremental: files are regenerated if dependency code changes", async () => {
	await baseHelper.build();

	// add comment at the top of store.ts => all pages are regenerated
	const modulePath = path.resolve(import.meta.dirname, "project/store.ts");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	await fs.promises.writeFile(modulePath, `//comment\n${originalData}`, { encoding: "utf-8" });

	await baseHelper.build();
	const cache = await baseHelper.getCacheExplorer();

	cache.assertPathAge("/page1/1", "new");
	cache.assertPathAge("/page1/2", "new");
	cache.assertPathAge("/page2/1", "new");
	cache.assertPathAge("/page2/2", "new");
});

test("inte/build/incremental: files are regenerated if data changes", async () => {
	await baseHelper.build();

	// modify data.json but only data used by page1/1 => page1/1 is regenerated
	const modulePath = path.resolve(import.meta.dirname, "project/data.json");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	const updatedData = JSON.parse(originalData);
	updatedData[0]["1"] = { data: 110 };
	await fs.promises.writeFile(modulePath, JSON.stringify(updatedData, null, 4), {
		encoding: "utf-8",
	});

	await baseHelper.build();
	const cache = await baseHelper.getCacheExplorer();

	cache.assertPathAge("/page1/1", "new");
	cache.assertPathAge("/page1/2", "old");
	cache.assertPathAge("/page2/1", "old");
	cache.assertPathAge("/page2/2", "old");
});
