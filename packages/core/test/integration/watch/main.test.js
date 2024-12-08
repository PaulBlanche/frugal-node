import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper, WatchHelper, puppeteer } from "@frugal-node/test-utils";

const buildHelper = await BuildHelper.setupFixtures(import.meta.dirname);
const watchHelper = new WatchHelper(import.meta.dirname);

await test("inte/watch: stable 'X-Frugal-Generation-Date' header when page did not change", async () => {
	watchHelper.watch();

	await watchHelper.awaitNextBuild();

	const response1 = await fetch("http://0.0.0.0:3001/page1/1");
	await new Promise((res) => setTimeout(res, 1500));
	const response2 = await fetch("http://0.0.0.0:3001/page1/1");

	// generation date did not change, because underlying data did not change
	assert.equal(
		response1.headers.get("X-Frugal-Generation-Date"),
		response2.headers.get("X-Frugal-Generation-Date"),
	);
	// last modified did change, because static page are dynamically generated in watch mode
	assert.notEqual(response1.headers.get("Last-Modified"), response2.headers.get("Last-Modified"));

	watchHelper.kill();
});

await test("inte/watch: files are regenerated if page code changes", async () => {
	watchHelper.watch();

	await watchHelper.awaitNextBuild();

	const watchCache1 = await getData();

	await new Promise((res) => setTimeout(res, 1500));

	// add a comment at the top of page1.ts
	const page1ModuleURL = new URL("./project/page1.ts", import.meta.url);
	const originalData = await fs.promises.readFile(page1ModuleURL, { encoding: "utf-8" });
	await fs.promises.writeFile(page1ModuleURL, `//comment\n${originalData}`, {
		encoding: "utf-8",
	});

	await watchHelper.awaitNextBuild();

	const watchCache2 = await getData();

	// moduleHash of path1.ts changed, cache result is regenerated
	assert.notEqual(watchCache1["/page1/1"].hash, watchCache2["/page1/1"].hash);
	assert.notEqual(watchCache1["/page1/1"].date, watchCache2["/page1/1"].date);

	assert.notEqual(watchCache1["/page1/2"].hash, watchCache2["/page1/2"].hash);
	assert.notEqual(watchCache1["/page1/2"].date, watchCache2["/page1/2"].date);

	// moduleHash of path2.ts did not changed, cache result is not changed
	assert.equal(watchCache1["/page2/1"].hash, watchCache2["/page2/1"].hash);
	assert.equal(watchCache1["/page2/1"].date, watchCache2["/page2/1"].date);

	assert.equal(watchCache1["/page2/2"].hash, watchCache2["/page2/2"].hash);
	assert.equal(watchCache1["/page2/2"].date, watchCache2["/page2/2"].date);

	await fs.promises.writeFile(page1ModuleURL, originalData, { encoding: "utf-8" });

	watchHelper.kill();
});

await test("inte/watch: files are regenerated if dependency code changes", async () => {
	watchHelper.watch();

	await watchHelper.awaitNextBuild();

	const watchCache1 = await getData();

	await new Promise((res) => setTimeout(res, 1500));

	// add a comment at the top of store.ts
	const storeModuleURL = new URL("./project/store.ts", import.meta.url);
	const originalData = await fs.promises.readFile(storeModuleURL, { encoding: "utf-8" });
	await fs.promises.writeFile(storeModuleURL, `//comment\n${originalData}`, {
		encoding: "utf-8",
	});

	await watchHelper.awaitNextBuild();

	const watchCache2 = await getData();

	// moduleHash of path1.ts changed because of store.ts, cache result is regenerated
	assert.notEqual(watchCache1["/page1/1"].hash, watchCache2["/page1/1"].hash);
	assert.notEqual(watchCache1["/page1/1"].date, watchCache2["/page1/1"].date);

	assert.notEqual(watchCache1["/page1/2"].hash, watchCache2["/page1/2"].hash);
	assert.notEqual(watchCache1["/page1/2"].date, watchCache2["/page1/2"].date);

	// moduleHash of path2.ts changed because of store.ts, cache result is regenerated
	assert.notEqual(watchCache1["/page2/1"].hash, watchCache2["/page2/1"].hash);
	assert.notEqual(watchCache1["/page2/1"].date, watchCache2["/page2/1"].date);

	assert.notEqual(watchCache1["/page2/2"].hash, watchCache2["/page2/2"].hash);
	assert.notEqual(watchCache1["/page2/2"].date, watchCache2["/page2/2"].date);

	await fs.promises.writeFile(storeModuleURL, originalData, { encoding: "utf-8" });

	watchHelper.kill();
});

await test("inte/watch: files are regenerated on demand if data changes", async () => {
	watchHelper.watch();

	await watchHelper.awaitNextBuild();

	const watchCache1 = await getData();

	await new Promise((res) => setTimeout(res, 1500));

	// modify data.json but only data used by page1/1
	const dataURL = new URL("./project/data.json", import.meta.url);
	const originalData = await fs.promises.readFile(dataURL, { encoding: "utf-8" });
	const updatedData = JSON.parse(originalData);
	updatedData[0]["1"] = {
		data: 110,
	};
	await fs.promises.writeFile(dataURL, JSON.stringify(updatedData, null, 4), {
		encoding: "utf-8",
	});

	const response11 = await fetch("http://0.0.0.0:3001/page1/1");
	await response11.text();
	const response22 = await fetch("http://0.0.0.0:3001/page2/2");
	await response22.text();

	const watchCache2 = await getData();

	// dataHash at /page1/1 changed and /page1/1 was visited, cache result is regenerated
	assert.notEqual(watchCache1["/page1/1"].hash, watchCache2["/page1/1"].hash);
	assert.notEqual(watchCache1["/page1/1"].date, watchCache2["/page1/1"].date);

	// dataHash for any other page did not change (wether the page was visited
	// or not), cache result is not changed
	assert.equal(watchCache1["/page1/2"].hash, watchCache2["/page1/2"].hash);
	assert.equal(watchCache1["/page1/2"].date, watchCache2["/page1/2"].date);

	assert.equal(watchCache1["/page2/1"].hash, watchCache2["/page2/1"].hash);
	assert.equal(watchCache1["/page2/1"].date, watchCache2["/page2/1"].date);

	assert.equal(watchCache1["/page2/2"].hash, watchCache2["/page2/2"].hash);
	assert.equal(watchCache1["/page2/2"].date, watchCache2["/page2/2"].date);

	await fs.promises.writeFile(dataURL, originalData, { encoding: "utf-8" });

	watchHelper.kill();
});

await test("inte/watch: browser reload on file change", async () => {
	watchHelper.watch();

	await watchHelper.awaitNextBuild();

	const page1ModuleURL = new URL("./project/page1.ts", import.meta.url);
	const originalPage1Data = await fs.promises.readFile(page1ModuleURL, { encoding: "utf-8" });

	await puppeteer.withPage(async ({ page }) => {
		await page.setJavaScriptEnabled(true);
		await page.goto("http://localhost:3001/page1/1");

		const pageReloadPromise = new Promise((res) => {
			page.exposeFunction("markReloaded", () => res(true));
		});

		await page.evaluate(`
            addEventListener("beforeunload", () => {
                markReloaded();
            });
        `);

		// add a comment at the top of page1.ts
		await fs.promises.writeFile(page1ModuleURL, `//comment\n${originalPage1Data}`, {
			encoding: "utf-8",
		});

		await watchHelper.awaitNextBuild();

		const reloaded = await pageReloadPromise;
		assert.equal(reloaded, true);
	});

	await fs.promises.writeFile(page1ModuleURL, originalPage1Data, { encoding: "utf-8" });

	watchHelper.kill();
});

await test("inte/watch: rebuild and browser reload on config change", async () => {
	watchHelper.watch();

	await watchHelper.awaitNextBuild();

	const configURL = new URL("./project/frugal.config.js", import.meta.url);
	let originalData;

	await puppeteer.withPage(async ({ page }) => {
		await page.setJavaScriptEnabled(true);
		await page.goto("http://localhost:3001/page1/1");

		const pageReloadPromise = new Promise((res) => {
			page.exposeFunction("markReloaded", () => res(true));
		});
		await page.evaluate(`
            addEventListener("beforeunload", () => {
                markReloaded();
            });
        `);

		// add a comment at the top of frugal.config.ts
		originalData = await fs.promises.readFile(configURL, { encoding: "utf-8" });
		await fs.promises.writeFile(configURL, `//comment\n${originalData}`, { encoding: "utf-8" });

		await watchHelper.awaitNextBuild();

		const reloaded = await pageReloadPromise;
		assert.equal(reloaded, true);
	});

	if (originalData) {
		await fs.promises.writeFile(configURL, originalData, { encoding: "utf-8" });
	}

	watchHelper.kill();
});

async function getData() {
	try {
		return JSON.parse(
			await fs.promises.readFile(
				path.resolve(buildHelper.internalBuildConfig.cacheDir, "./watch-cache.json"),
				{
					encoding: "utf-8",
				},
			),
		);
	} catch {
		return {};
	}
}
