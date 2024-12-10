import * as path from "node:path";
import { BuildConfig } from "@frugal-node/core/config/build";
import * as fs from "../../../../src/utils/fs.js";
import { WatchCache } from "../../../../src/watch/WatchCache.js";
import { WatchContext } from "../../../../src/watch/WatchContext.js";
import buildConfig from "./frugal.build.js";

const internalBuildConfig = BuildConfig.create(buildConfig);
await internalBuildConfig.validate();

const CACHE_FILE = path.resolve(internalBuildConfig.cacheDir, "./watch-cache.json");

const context = WatchContext.create(
	internalBuildConfig,
	WatchCache.create({ file: CACHE_FILE, data: await getData() }),
);

context.watch({ port: 3001 });

process.addListener("SIGINT", async () => {
	await context.dispose();
	process.exit(1);
});

async function getData() {
	try {
		return JSON.parse(await fs.readTextFile(CACHE_FILE));
	} catch {
		return {};
	}
}
