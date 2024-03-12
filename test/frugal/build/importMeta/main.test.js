import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import * as path from "node:path";
import { test } from "node:test";
import { BuildHelper } from "../../../utils/BuildHelper.js";

const baseHelper = await BuildHelper.setup(import.meta.dirname);

test("inte/frugal/build/importMeta: transform 'new URL(..., import.meta.url)' to point to a copied local asset", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./pageWithLocalFile.ts"] } });
	await helper.build();

	const manifest = await helper.getManifest();
	const result = await /** @type{any} */ (manifest.pages[0].descriptor).build({
		data: /** @param {any} data */ (data) => data,
	});

	const assetUrl = new URL(result);
	const assetContent = await fs.promises.readFile(assetUrl, { encoding: "utf-8" });
	const originalUrl = new URL("./fixtures/foo.txt", import.meta.url);
	const originalContent = await fs.promises.readFile(originalUrl, { encoding: "utf-8" });

	assert.notEqual(assetUrl.href, originalUrl.href);
	assert.deepEqual(assetContent, originalContent);
});

test("inte/frugal/build/importMeta: throws when asset referenced in 'new URL(..., import.meta.url)' is not found", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./pageWithNonExistentLocalFile.ts"] } });

	await assert.rejects(
		async () => {
			await helper.build();
		},
		(error) => {
			assert.ok(error instanceof Error);
			const match = error.message.match(/ENOENT:.*'(.*)'/);
			if (match) {
				const assetPath = match[1];
				assert.equal(
					path.relative(helper.config.rootDir, assetPath),
					"file-not-existing.txt",
				);
			}
			return true;
		},
	);
});

test("inte/frugal/build/importMeta: skip dynamic 'new URL(..., import.meta.url)'", async () => {
	const helper = baseHelper.extends({ global: { pages: ["./pageWithDynamicLocalFile.ts"] } });
	await helper.build();

	const manifest = await helper.getManifest();
	const result = await /** @type{any} */ (manifest.pages[0].descriptor).build({
		data: /** @param {any} data */ (data) => data,
	});

	const assetUrl = new URL(result);

	await assert.rejects(
		async () => {
			await fs.promises.stat(assetUrl);
		},
		(error) => {
			assert.deepEqual(error.code, "ENOENT");
			return true;
		},
	);
});
