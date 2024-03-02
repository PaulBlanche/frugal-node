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
export async function build(config, buildConfig, extraPlugins) {
	const context = PluginContext.create(config, buildConfig, false);
	const esbuildConfig = getEsbuildConfig(config, buildConfig, context, extraPlugins);
	log(`Esbuild config:\n${JSON.stringify(esbuildConfig)}`, { scope: "Bundler", level: "debug" });
	return await esbuild.build(esbuildConfig);
}

/** @type {import('./bundler.ts').context} */
export async function context(config, buildConfig, extraPlugins) {
	const context = PluginContext.create(config, buildConfig, true);
	return await esbuild.context(getEsbuildConfig(config, buildConfig, context, extraPlugins));
}

/**
 * @param {import("../Config.js").FrugalConfig} config
 * @param {import("../BuildConfig.js").FrugalBuildConfig} buildConfig
 * @param {import("./PluginContext.js").PrivatePluginContext} context
 * @param {(import("./Plugin.js").Plugin|import("./Plugin.js").PrivatePlugin)[]} [extraPlugins]
 * @returns {esbuild.BuildOptions}
 */
function getEsbuildConfig(config, buildConfig, context, extraPlugins = []) {
	return {
		...buildConfig.esbuildOptions,
		target: ["esnext"],
		entryPoints: [...config.pages, config.self],
		entryNames: "[name]-[hash]",
		chunkNames: "[name]-[hash]",
		assetNames: "[name]-[hash]",
		bundle: true,
		metafile: true,
		write: false,
		splitting: true,
		sourcemap: false,
		minify: false,
		define: {
			...buildConfig.esbuildOptions?.define,
			// used to drop browser code in script assets
			"import.meta.environment": "'server'",
		},
		format: "esm",
		outdir: config.buildDir,
		plugins: [
			output(),
			buildManifest(context),
			copy([
				{
					from: config.staticDir,
					to: config.publicDir,
					recursive: true,
					forgiveNotFound: true,
				},
			]),
			report(),
			cleanOutDir(config, buildConfig),
			importMetaAssets(config),
			...(buildConfig.esbuildOptions?.plugins ?? []),
			...[...(buildConfig.plugins ?? []), ...extraPlugins].map(
				/** @returns {esbuild.Plugin} */ (plugin) => ({
					name: plugin.name,
					setup: (build) => plugin.setup(build, context),
				}),
			),
			externalDependency(),
		],
		absWorkingDir: config.rootDir,
		logLevel: "silent",
		outExtension: { ".js": ".mjs" },
		platform: "node",
	};
}
