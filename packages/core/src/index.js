/** @import * as self from "./index.js" */

import { BuildConfig } from "./BuildConfig.js";
import * as builder from "./build/build.js";
import { getDynamicManifestPath, getStaticManifestPath } from "./build/manifest.js";
import { BuildSnapshot } from "./exporter/BuildSnapshot.js";
import { WatchCache } from "./watch/WatchCache.js";
import { WatchContext } from "./watch/WatchContext.js";

/** @type {self.build} */
export async function build(buildConfig) {
	const internalBuildConfig = BuildConfig.create(buildConfig);
	await internalBuildConfig.validate();

	await builder.build(internalBuildConfig);

	if (internalBuildConfig.exporter) {
		const snapshot = await BuildSnapshot.load({ dir: internalBuildConfig.buildCacheDir });
		const staticManifestPath = await getStaticManifestPath(internalBuildConfig);
		const dynamicManifestPath = await getDynamicManifestPath(internalBuildConfig);

		await internalBuildConfig.exporter.export({
			config: internalBuildConfig,

			get snapshot() {
				return snapshot;
			},

			get staticManifestPath() {
				return staticManifestPath;
			},

			get dynamicManifestPath() {
				return dynamicManifestPath;
			},
		});
	}
}

/** @type {self.context} */
export async function context(buildConfig) {
	const internalBuildConfig = BuildConfig.create(buildConfig);
	await internalBuildConfig.validate();

	return WatchContext.create(internalBuildConfig, WatchCache.create());
}
