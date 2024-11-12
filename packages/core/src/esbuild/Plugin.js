/** @import * as self from "./Plugin.js" */
/** @import { WritableManifest } from "../build/manifest.js" */

import { log } from "../utils/log.js";
import { ModuleCollector } from "./ModuleCollector.js";

/** @type {self.PluginContextCreator} */
export const PluginContext = {
	internal,
	external,
};

/** @type {self.PluginContextCreator['external']} */
function external(buildConfig, watch) {
	return internal(buildConfig, watch);
}

/** @type {self.PluginContextCreator['internal']} */
function internal(buildConfig, watch = false) {
	const state = {
		/** @type {WritableManifest} */
		manifest: {
			assets: [],
			hash: "",
			pages: [],
			runtimeConfig: "",
		},
	};

	return {
		get manifest() {
			return state.manifest;
		},

		get buildConfig() {
			return buildConfig;
		},

		get watch() {
			return watch;
		},

		output,
		collectModules,
		updateManifest,
		reset,
	};

	/** @type {self.InternalPluginContext['output']} */
	function output(_, asset) {
		state.manifest.assets.push(asset);
	}

	/** @type {self.InternalPluginContext['collectModules']} */
	function collectModules(filter, metafile) {
		return ModuleCollector.create({ rootDir: buildConfig.rootDir }, metafile).collect(filter);
	}

	/** @type {self.InternalPluginContext['updateManifest']} */
	function updateManifest({ hash, pages, runtimeConfig }) {
		state.manifest.hash = hash;
		state.manifest.pages = pages;
		state.manifest.runtimeConfig = runtimeConfig;
	}

	/** @type {self.InternalPluginContext['reset']} */
	function reset() {
		state.manifest = {
			assets: [],
			hash: "",
			pages: [],
			runtimeConfig: "",
		};
	}
}
/** @type {self.wrapErrors} */
export function wrapErrors(plugin) {
	return {
		...plugin,
		setup(build) {
			plugin.setup({
				...build,
				onStart(onStartCallback) {
					build.onStart(async (...callbackArgs) => {
						try {
							return await onStartCallback(...callbackArgs);
						} catch (/**@type {any}*/ error) {
							log(error, {
								level: "error",
								scope: plugin.name,
							});
							throw error;
						}
					});
				},
				onEnd(onEndCallback) {
					build.onEnd(async (...callbackArgs) => {
						try {
							return await onEndCallback(...callbackArgs);
						} catch (/**@type {any}*/ error) {
							log(error, {
								level: "error",
								scope: plugin.name,
							});
							throw error;
						}
					});
				},
				onResolve(onResolveOptions, onResolveCallback) {
					build.onResolve(onResolveOptions, async (...callbackArgs) => {
						try {
							return await onResolveCallback(...callbackArgs);
						} catch (/**@type {any}*/ error) {
							log(error, {
								level: "error",
								scope: plugin.name,
							});
							throw error;
						}
					});
				},
				onLoad(onLoadOptions, onLoadCallback) {
					build.onLoad(onLoadOptions, async (...callbackArgs) => {
						try {
							return await onLoadCallback(...callbackArgs);
						} catch (/**@type {any}*/ error) {
							log(error, {
								level: "error",
								scope: plugin.name,
							});
							throw error;
						}
					});
				},
				onDispose(onDisposeCallback) {
					build.onDispose(async (...callbackArgs) => {
						try {
							return await onDisposeCallback(...callbackArgs);
						} catch (/**@type {any}*/ error) {
							log(error, {
								level: "error",
								scope: plugin.name,
							});
							throw error;
						}
					});
				},
			});
		},
	};
}
