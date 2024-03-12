import * as assert from "node:assert/strict";
import * as path from "node:path";
import { test } from "node:test";
import * as url from "node:url";
import { FileWatcher } from "../../../packages/frugal/src/utils/FileWatcher.js";
import * as fs from "../../../packages/frugal/src/utils/fs.js";

test("unit/frugal/utils/fileWatcher.js: FileWatcher events", async () => {
	const dataDir = url.fileURLToPath(import.meta.resolve("./data"));
	await safeRemoveDir(dataDir);
	await fs.ensureDir(dataDir);

	const watcher = FileWatcher.watch([url.fileURLToPath(import.meta.resolve("./data"))], {
		interval: 300,
	});

	/** @type {import("../../../packages/frugal/src/utils/FileWatcher.js").FsEvent[]} */
	const events = [];

	(async () => {
		for await (const event of watcher) {
			events.push(event);
		}
	})();

	await watcher.ready;

	// create file
	await fs.writeTextFile(path.resolve(dataDir, "foo.txt"), "foo");
	await new Promise((res) => setTimeout(res, 400));

	assert.deepEqual(events, [
		{
			type: "create",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
		{
			type: "any",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
	]);
	events.length = 0;

	// edit file
	await fs.writeTextFile(path.resolve(dataDir, "foo.txt"), "foobar");
	await new Promise((res) => setTimeout(res, 400));

	assert.deepEqual(events, [
		{
			type: "modify",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
		{
			type: "any",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
	]);
	events.length = 0;

	// remove file
	await fs.remove(path.resolve(dataDir, "foo.txt"));
	await new Promise((res) => setTimeout(res, 400));

	assert.deepEqual(events, [
		{
			type: "remove",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
		{
			type: "any",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
	]);
	events.length = 0;

	watcher.close();
});

test("unit/frugal/utils/fs.js: FileWatcher debounce", async () => {
	const dataDir = url.fileURLToPath(import.meta.resolve("./data"));
	await safeRemoveDir(dataDir);
	await fs.ensureDir(dataDir);

	await fs.writeTextFile(path.resolve(dataDir, "foo.txt"), "foo");
	await fs.writeTextFile(path.resolve(dataDir, "bar.txt"), "bar");

	const watcher = FileWatcher.watch([url.fileURLToPath(import.meta.resolve("./data"))], {
		interval: 300,
	});

	/** @type {import("../../../packages/frugal/src/utils/FileWatcher.js").FsEvent[]} */
	const events = [];

	(async () => {
		for await (const event of watcher) {
			events.push(event);
		}
	})();

	await watcher.ready;

	// create and edit multiple files
	await fs.writeTextFile(path.resolve(dataDir, "foo.txt"), "foobar");
	await fs.writeTextFile(path.resolve(dataDir, "bar.txt"), "foobar");
	await fs.writeTextFile(path.resolve(dataDir, "baz.txt"), "baz");
	await fs.writeTextFile(path.resolve(dataDir, "quux.txt"), "quux");

	await new Promise((res) => setTimeout(res, 400));

	assert.deepEqual(events, [
		{
			type: "modify",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
		{
			type: "any",
			paths: [path.resolve(dataDir, "foo.txt")],
		},
		{
			type: "modify",
			paths: [path.resolve(dataDir, "bar.txt")],
		},
		{
			type: "any",
			paths: [
				path.resolve(dataDir, "bar.txt"),
				path.resolve(dataDir, "baz.txt"),
				path.resolve(dataDir, "quux.txt"),
			],
		},
		{
			type: "create",
			paths: [path.resolve(dataDir, "baz.txt"), path.resolve(dataDir, "quux.txt")],
		},
	]);

	watcher.close();
});

/**
 * @param {string} path
 */
async function safeRemoveDir(path) {
	try {
		await fs.remove(path, { recursive: true });
	} catch (error) {
		if (!(error instanceof fs.NotFound)) {
			throw error;
		}
	}
}
