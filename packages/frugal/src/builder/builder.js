import * as bundler from "../bundler/bundler.js";
import { log } from "../utils/log.js";
import { BuildCache } from "./BuildCache.js";
import { buildPlugin } from "./buildPlugin.js";

/** @type {import('./builder.ts').build} */
export async function build(buildConfig) {
	log("Start building", { scope: "Builder", level: "debug" });

	const cache = await BuildCache.load({
		dir: buildConfig.global.buildCacheDir,
	});

	await bundler.build(buildConfig, [buildPlugin(cache)]);

	log("Build done", { scope: "Builder", level: "debug" });
}
