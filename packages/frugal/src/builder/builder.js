import * as config from "../Config.js";
import * as bundler from "../bundler/bundler.js";
import { log } from "../utils/log.js";
import * as cache from "./Cache.js";
import { buildPlugin } from "./buildPlugin.js";

/**
 * @param {config.FrugalConfig} frugalConfig
 * @returns {Promise<void>}
 */
export async function build(frugalConfig) {
	log("Start building", { scope: "Builder", level: "debug" });

	const buildCache = await cache.load({
		dir: frugalConfig.buildCacheDir,
	});

	await bundler.build(frugalConfig, [buildPlugin(buildCache)]);

	log("Build done", { scope: "Builder", level: "debug" });
}
