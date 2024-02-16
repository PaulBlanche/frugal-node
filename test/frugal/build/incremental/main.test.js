import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "../../../utils/BuildHelper.js";

const helper = await BuildHelper.setup(import.meta.dirname);

test("inte/frugal/build/incremental: files are not changed is nothing changed", async () => {
	await helper.build();
	const firstBuildCache = await helper.getCache();
	await firstBuildCache.assertPathAge("/page1/1", "new");
	await firstBuildCache.assertPathAge("/page1/2", "new");
	await firstBuildCache.assertPathAge("/page2/1", "new");
	await firstBuildCache.assertPathAge("/page2/2", "new");

	await helper.build();
	const secondBuildCache = await helper.getCache();
	await secondBuildCache.assertPathAge("/page1/1", "old");
	await secondBuildCache.assertPathAge("/page1/2", "old");
	await secondBuildCache.assertPathAge("/page2/1", "old");
	await secondBuildCache.assertPathAge("/page2/2", "old");
});

test("inte/frugal/build/incremental: files regenerated if page code changes", async () => {
	await helper.build();

	// add comment at the top of page1.ts
	const modulePath = path.resolve(import.meta.dirname, "project/page1.ts");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	await fs.promises.writeFile(modulePath, `//comment\n${originalData}`, { encoding: "utf-8" });

	await helper.build();
	const cache = await helper.getCache();
	await cache.assertPathAge("/page1/1", "new");
	await cache.assertPathAge("/page1/2", "new");
	await cache.assertPathAge("/page2/1", "old");
	await cache.assertPathAge("/page2/2", "old");
});

test("inte/frugal/build/incremental: files regenerated if dependency code changes", async () => {
	await helper.build();

	// add comment at the top of store.ts
	const modulePath = path.resolve(import.meta.dirname, "project/store.ts");
	const originalData = await fs.promises.readFile(modulePath, { encoding: "utf-8" });
	await fs.promises.writeFile(modulePath, `//comment\n${originalData}`, { encoding: "utf-8" });

	await helper.build();
	const cache = await helper.getCache();
	await cache.assertPathAge("/page1/1", "new");
	await cache.assertPathAge("/page1/2", "new");
	await cache.assertPathAge("/page2/1", "new");
	await cache.assertPathAge("/page2/2", "new");
});

test("inte/frugal/build/incremental: files regenerated if data changes", async () => {
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
	await cache.assertPathAge("/page1/1", "new");
	await cache.assertPathAge("/page1/2", "old");
	await cache.assertPathAge("/page2/1", "old");
	await cache.assertPathAge("/page2/2", "old");
});
