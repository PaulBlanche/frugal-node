import * as esbuild from "esbuild";
import { log } from "../utils/log.js";
import { PluginContext } from "./PluginContext.js";
import { buildManifest } from "./plugins/buildManifest.js";
import { cleanOutDir } from "./plugins/cleanOutDir.js";
import { copy } from "./plugins/copy.js";
import { externalDependency } from "./plugins/externalDependency.js";
import { importMetaAssets } from "./plugins/importMetaAssets/importMetaAssets.js";
import { output } from "./plugins/output.js";
import { report } from "./plugins/report.js";

/** @type {import('./bundler.ts').build} */
export async function build(buildConfig, extraPlugins) {
	const context = PluginContext.create(buildConfig, false);
	const esbuildConfig = getEsbuildConfig(buildConfig, context, extraPlugins);
	log(`Esbuild config:\n${JSON.stringify(esbuildConfig)}`, { scope: "Bundler", level: "debug" });
	return await esbuild.build(esbuildConfig);
}

/** @type {import('./bundler.ts').context} */
export async function context(config, extraPlugins) {
	const context = PluginContext.create(config, true);
	return await esbuild.context(getEsbuildConfig(config, context, extraPlugins));
}

/**
 * @param {import("../Config.js").FrugalBuildConfig} config
 * @param {import("./PluginContext.js").PrivatePluginContext} context
 * @param {(import("./Plugin.js").Plugin|import("./Plugin.js").PrivatePlugin)[]} [extraPlugins]
 * @returns {esbuild.BuildOptions}
 */
function getEsbuildConfig(config, context, extraPlugins = []) {
	return {
		...config.esbuildOptions,
		target: ["esnext"],
		entryPoints: [...config.global.pages, config.global.self],
		entryNames: "[dir]/[name]-[hash]",
		chunkNames: "[dir]/[name]-[hash]",
		assetNames: "[dir]/[name]-[hash]",
		bundle: true,
		metafile: true,
		write: false,
		splitting: true,
		sourcemap: false,
		minify: false,
		define: {
			...config.esbuildOptions?.define,
			// used to drop browser code in script assets
			"import.meta.environment": "'server'",
		},
		format: "esm",
		outdir: config.global.buildDir,
		plugins: [
			output(),
			buildManifest(context),
			copy([
				{
					from: config.global.staticDir,
					to: config.global.publicDir,
					recursive: true,
					forgiveNotFound: true,
				},
			]),
			report(),
			cleanOutDir(config),
			importMetaAssets(config),
			...(config.esbuildOptions?.plugins ?? []),
			...[...(config.plugins ?? []), ...extraPlugins].map(
				/** @returns {esbuild.Plugin} */ (plugin) => ({
					name: plugin.name,
					setup: (build) => plugin.setup(build, context),
				}),
			),
			externalDependency(),
		],
		absWorkingDir: config.global.rootDir,
		logLevel: "silent",
		outExtension: { ".js": ".mjs" },
		platform: "node",
	};
}
