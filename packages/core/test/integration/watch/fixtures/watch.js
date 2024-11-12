import * as path from "node:path";
import { BuildConfig } from "@frugal-node/core/config/build";
import { toResponse } from "../../../../src/page/FrugalResponse.js";
import * as fs from "../../../../src/utils/fs.js";
import { WatchContext } from "../../../../src/watch/WatchContext.js";
import buildConfig from "./frugal.build.js";

const internalBuildConfig = BuildConfig.create(buildConfig);
await internalBuildConfig.validate();

const data = await getData();

const context = WatchContext.create(internalBuildConfig, {
	async add(response) {
		if (response.path in data) {
			const previous = data[response.path];
			if (previous.hash === response.hash) {
				return;
			}
		}

		data[response.path] = response.serialize();
		await this.save();
	},

	async has(key) {
		const entry = data[key];
		if (entry === undefined) {
			return false;
		}
		return true;
	},

	async get(key) {
		const entry = await data[key];
		if (entry === undefined) {
			return undefined;
		}

		return toResponse(entry);
	},

	async save() {
		await fs.ensureFile(path.resolve(internalBuildConfig.cacheDir, "./watch-cache.json"));
		await fs.writeTextFile(
			path.resolve(internalBuildConfig.cacheDir, "./watch-cache.json"),
			JSON.stringify(data),
		);
	},
});

context.watch({ port: 3001 });

process.addListener("SIGINT", async () => {
	await context.dispose();
	process.exit(1);
});

async function getData() {
	try {
		return JSON.parse(
			await fs.readTextFile(path.resolve(internalBuildConfig.cacheDir, "./watch-cache.json")),
		);
	} catch {
		return {};
	}
}
