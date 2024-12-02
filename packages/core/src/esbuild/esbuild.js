/** @import * as self from "./esbuild.js" */
/** @import { EsbuildOptions, InternalBuildConfig } from "../BuildConfig.js" */
/** @import { InternalPluginContext, Plugin, InternalPlugin } from "./Plugin.js" */

import * as esbuild from "esbuild";
import { log } from "../utils/log.js";
import { PluginContext, wrapErrors } from "./Plugin.js";
import { buildManifest } from "./plugins/buildManifest.js";
import { cleanOutDir } from "./plugins/cleanOutDir.js";
import { copy } from "./plugins/copy.js";
import { externalDependency } from "./plugins/externalDependency.js";
import { importMetaAssets } from "./plugins/importMetaAssets/importMetaAssets.js";
import { output } from "./plugins/output.js";
import { report } from "./plugins/report.js";

/** @type {self.build} */
export async function build(buildConfig, extraPlugins) {
	const context = PluginContext.internal(buildConfig, false);

	const esbuildConfig = getEsbuildConfig(buildConfig, context, false, extraPlugins);
	log(`Esbuild config:\n${JSON.stringify(esbuildConfig)}`, {
		scope: "Bundler",
		level: "debug",
	});
	return await esbuild.build(esbuildConfig);
}

/** @type {self.context} */
export async function context(buildConfig, extraPlugins) {
	const context = PluginContext.internal(buildConfig, true);

	return await esbuild.context(getEsbuildConfig(buildConfig, context, true, extraPlugins));
}

/**
 * @param {InternalBuildConfig} buildConfig
 * @param {InternalPluginContext} context
 * @param {boolean} watch
 * @param {(Plugin|InternalPlugin)[]} [extraPlugins]
 * @returns {esbuild.BuildOptions}
 */
function getEsbuildConfig(buildConfig, context, watch, extraPlugins = []) {
	const defaultConfig = defaultEsbuildConfig(watch);

	return {
		...defaultConfig,
		...buildConfig.esbuildOptions,
		entryPoints: [...buildConfig.pages, buildConfig.runtimeConfigPath],
		define: {
			...buildConfig.esbuildOptions?.define,
			...defaultConfig?.define,
		},
		outdir: buildConfig.buildDir,
		plugins: [
			output(),
			buildManifest(context),
			copy([
				{
					from: buildConfig.staticDir,
					to: buildConfig.publicDir,
					recursive: true,
					forgiveNotFound: true,
				},
			]),
			report(),
			cleanOutDir(),
			importMetaAssets(context),
			...(buildConfig.esbuildOptions?.plugins ?? []),
			...[...(buildConfig.plugins ?? []), ...extraPlugins].map(
				/** @returns {esbuild.Plugin} */ (plugin) => ({
					name: plugin.name,
					setup: (build) => plugin.setup(build, context),
				}),
			),
			externalDependency(),
		].map(wrapErrors),
		absWorkingDir: buildConfig.rootDir,
	};
}

/** @type {self.defaultEsbuildConfig} */
export function defaultEsbuildConfig(watch) {
	console.log("######################################", process.env["NODE_ENV"]);
	return {
		target: ["esnext"],
		entryNames: "[name]-[hash]",
		chunkNames: "[name]-[hash]",
		assetNames: "[name]-[hash]",
		bundle: true,
		metafile: true,
		write: false,
		splitting: true,
		sourcemap:
			process.env["NODE_ENV"] === undefined
				? watch
					? "linked"
					: false
				: process.env["NODE_ENV"] === "production"
					? false
					: "linked",
		minify:
			process.env["NODE_ENV"] === undefined
				? !watch
				: process.env["NODE_ENV"] === "production",
		define: {
			// used to drop browser code in script assets
			"import.meta.environment": "'server'",
			"process.env.NODE_ENV":
				process.env["NODE_ENV"] === undefined
					? watch
						? '"development"'
						: '"production"'
					: `"${process.env["NODE_ENV"]}"`,
		},
		format: "esm",
		logLevel: "silent",
		outExtension: { ".js": ".mjs" },
		platform: "node",
	};
}
