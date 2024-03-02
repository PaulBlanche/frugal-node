import * as bundler from "../bundler/bundler.js";
import { log } from "../utils/log.js";
import { BuildCache } from "./BuildCache.js";
import { buildPlugin } from "./buildPlugin.js";

/** @type {import('./builder.ts').build} */
export async function build(config, buildConfig) {
	log("Start building", { scope: "Builder", level: "debug" });

	const cache = await BuildCache.load({
		dir: config.buildCacheDir,
	});

	await bundler.build(config, buildConfig, [buildPlugin(cache)]);

	log("Build done", { scope: "Builder", level: "debug" });
}
