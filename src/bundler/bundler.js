import * as esbuild from "esbuild";
import { FrugalConfig } from "../Config.js";
import { log } from "../utils/log.js";
import * as plugin from "./Plugin.js";
import { PluginContext } from "./PluginContext.js";
import { buildManifest } from "./plugins/buildManifest.js";
import { cleanOutdir } from "./plugins/cleanOutDir.js";
import { externalDependency } from "./plugins/externalDependency.js";
import { output } from "./plugins/output.js";
import { report } from "./plugins/report.js";

/**
 * @param {FrugalConfig} config
 * @param {plugin.Plugin[]} [extraPlugins]
 */
export async function build(config, extraPlugins) {
	const pluginContext = new PluginContext(config, false);
	const esbuildConfig = getEsbuildConfig(config, pluginContext, extraPlugins);
	log(`Esbuild config:\n${JSON.stringify(esbuildConfig)}`, { scope: "Bundler", level: "debug" });
	return await esbuild.build(esbuildConfig);
}

/**
 * @param {FrugalConfig} config
 * @param {plugin.Plugin[]} [extraPlugins]
 */
export async function context(config, extraPlugins) {
	const pluginContext = new PluginContext(config, true);
	return await esbuild.context(getEsbuildConfig(config, pluginContext, extraPlugins));
}

/**
 * @param {FrugalConfig} config
 * @param {PluginContext} context
 * @param {plugin.Plugin[]} [extraPlugins]
 * @returns {esbuild.BuildOptions}
 */
function getEsbuildConfig(config, context, extraPlugins = []) {
	return {
		...config.esbuildOptions,
		target: ["esnext"],
		entryPoints: [...config.pages, config.self],
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
		outdir: config.buildDir,
		plugins: [
			output(),
			buildManifest(context),
			report(),
			cleanOutdir(context.config),
			...(config.esbuildOptions?.plugins ?? []),
			...[...(config.plugins ?? []), ...extraPlugins].map(
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
