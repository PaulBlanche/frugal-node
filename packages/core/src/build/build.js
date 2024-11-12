/** @import * as self from "./build.js" */

import * as esbuild from "../esbuild/esbuild.js";
import { log } from "../utils/log.js";
import { BuildCache } from "./BuildCache.js";
import { buildPlugin } from "./buildPlugin.js";

/** @type {self.build} */
export async function build(buildConfig) {
	await buildConfig.validate();

	log("Start building", { scope: "Builder", level: "debug" });

	const cache = await BuildCache.load({
		dir: buildConfig.buildCacheDir,
	});

	await esbuild.build(buildConfig, [buildPlugin(cache)]);

	log("Build done", { scope: "Builder", level: "debug" });
}
