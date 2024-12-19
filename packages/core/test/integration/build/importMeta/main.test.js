import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "@frugal-node/test-utils";

const baseHelper = await BuildHelper.setupFixtures(import.meta.dirname);

test("inte/build/importMeta: transform 'new URL(..., import.meta.url)' to point to a copied local asset", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./pageWithLocalFile.ts"],
	}));
	await helper.build();

	const manifest = await helper.manifest.static;
	const bundledDescriptor = /** @type {any} */ (manifest.pages[0].descriptor);
	const pageResponse = await bundledDescriptor.build({});

	const assetUrl = new URL(pageResponse.data);
	const assetContent = await fs.promises.readFile(assetUrl, { encoding: "utf-8" });
	const originalUrl = new URL("./fixtures/foo.txt", import.meta.url);
	const originalContent = await fs.promises.readFile(originalUrl, { encoding: "utf-8" });

	assert.notEqual(assetUrl.href, originalUrl.href);
	assert.deepEqual(assetContent, originalContent);
});

test("inte/build/importMeta: throws when asset referenced in 'new URL(..., import.meta.url)' is not found", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./pageWithNonExistentLocalFile.ts"],
	}));

	await assert.rejects(
		async () => {
			await helper.build();
		},
		(error) => {
			assert.ok(error instanceof Error);
			// biome-ignore lint/performance/useTopLevelRegex: what happens in tests, stays in tests
			const match = error.message.match(/ENOENT:.*'(.*)'/);
			if (match) {
				const assetPath = match[1];
				assert.equal(
					path.relative(helper.internalBuildConfig.rootDir, assetPath),
					"file-not-existing.txt",
				);
			}
			return true;
		},
	);
});

test("inte/build/importMeta: detect fake dynamic 'new URL(..., import.meta.url)'", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./pageWithFakeDynamic.ts"],
	}));
	await helper.build();

	const manifest = await helper.manifest.static;
	const bundledDescriptor = /** @type {any} */ (manifest.pages[0].descriptor);
	const pageResponse = await bundledDescriptor.build({});

	const assetUrl = new URL(pageResponse.data);
	const assetContent = await fs.promises.readFile(assetUrl, { encoding: "utf-8" });
	const originalUrl = new URL("./fixtures/bar.txt", import.meta.url);
	const originalContent = await fs.promises.readFile(originalUrl, { encoding: "utf-8" });

	assert.notEqual(assetUrl.href, originalUrl.href);
	assert.deepEqual(assetContent, originalContent);
});

test("inte/build/importMeta: dynamic 'new URL(..., import.meta.url)' glob copy assets", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./pageWithDynamicLocalFile.ts"],
	}));
	await helper.build();

	const manifest = await helper.manifest.static;
	const bundledDescriptor = /** @type {any} */ (manifest.pages[0].descriptor);
	const pageResponse = await bundledDescriptor.build({});

	const assetUrl1 = new URL(pageResponse.data.url1);
	const assetContent1 = await fs.promises.readFile(assetUrl1, { encoding: "utf-8" });
	const originalUrl1 = new URL("./fixtures/bar.txt", import.meta.url);
	const originalContent1 = await fs.promises.readFile(originalUrl1, { encoding: "utf-8" });

	const assetUrl2 = new URL(pageResponse.data.url2);
	const assetContent2 = await fs.promises.readFile(assetUrl2, { encoding: "utf-8" });
	const originalUrl2 = new URL("./fixtures/baz.txt", import.meta.url);
	const originalContent2 = await fs.promises.readFile(originalUrl2, { encoding: "utf-8" });

	assert.notEqual(assetUrl1.href, originalUrl1.href);
	assert.deepEqual(assetContent1, originalContent1);
	assert.notEqual(assetUrl2.href, originalUrl2.href);
	assert.deepEqual(assetContent2, originalContent2);
});

test("inte/build/importMeta: 'new URL(..., import.meta.url)' with bare name", async () => {
	const helper = await baseHelper.extends((config) => ({
		...config,
		pages: ["./pageWithBareResolve.ts"],
	}));

	await assert.rejects(async () => {
		await helper.build();
	});
});
