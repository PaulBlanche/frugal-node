import * as path from "node:path";
import {
	FrugalBuildConfig,
	FrugalConfig,
} from "../../../../packages/frugal/exports/config/index.js";
import * as frugal from "../../../../packages/frugal/exports/index.js";
import * as generationResponse from "../../../../packages/frugal/src/page/GenerationResponse.js";
import { Hash } from "../../../../packages/frugal/src/utils/Hash.js";
import * as fs from "../../../../packages/frugal/src/utils/fs.js";
import { WatchCache } from "../../../../packages/frugal/src/watcher/WatchCache.js";
import { WatchContext } from "../../../../packages/frugal/src/watcher/WatchContext.js";
import buildConfig from "./frugal.config.build.js";
import config from "./frugal.config.js";

const frugalConfig = FrugalConfig.create(config);
await frugalConfig.validate();

const frugalBuildConfig = FrugalBuildConfig.create(buildConfig);

const data = await getData();

const context = WatchContext.create(frugalConfig, frugalBuildConfig, {
	async add(response) {
		if (response.path in data) {
			const previous = data[response.path];
			if (previous.hash === response.hash) {
				return;
			}
		}

		data[response.path] = await response.serialize();
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

		return generationResponse.toResponse(entry);
	},

	async save() {
		await fs.ensureFile(path.resolve(frugalConfig.cacheDir, "./watch-cache.json"));
		await fs.writeTextFile(
			path.resolve(frugalConfig.cacheDir, "./watch-cache.json"),
			JSON.stringify(data),
		);
	},
});

context.addEventListener((type) => {
	console.log(type);
});

process.on("SIGINT", async () => {
	await context.dispose();
	process.exit();
});

await context.watch();

async function getData() {
	try {
		return JSON.parse(
			await fs.readTextFile(path.resolve(frugalConfig.cacheDir, "./watch-cache.json")),
		);
	} catch {
		return {};
	}
}
