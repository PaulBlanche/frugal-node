/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import * as self from "./css.js" */
/** @import * as esbuild from "esbuild" */
/** @import { Bundle } from "./Bundler.js" */

import * as path from "node:path";
import { PluginEsbuild, cleanOutDir, output } from "@frugal-node/core/plugin";
import { Hash } from "@frugal-node/core/utils/Hash";
import * as fs from "@frugal-node/core/utils/fs";
import { log } from "@frugal-node/core/utils/log";
import { Bundler } from "./Bundler.js";
import { cssModules } from "./cssModules.js";

/** @type {self.css} */
export function css(options = {}) {
	const outdir = options?.outdir ?? "css/";
	const scope = options?.scope ?? "page";
	const cssModule = options?.cssModule ?? false;

	const cssModulesPlugin = cssModules(cssModule);

	return {
		name: "frugal:css",
		setup(build, context) {
			const compiler = PluginEsbuild.create("css");

			if (cssModule) {
				cssModulesPlugin.setup(build, context);
			}

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (metafile === undefined || errors.length !== 0) {
					return;
				}

				/** @type {Bundle[]} */
				const bundles = [];

				for (const outputPath of Object.keys(metafile.outputs)) {
					const output = metafile.outputs[outputPath];
					const cssBundle = output.cssBundle;
					const entrypoint = output.entryPoint;
					if (entrypoint) {
						if (cssBundle) {
							log(
								`Found css bundle "${path.relative(
									context.buildConfig.rootDir,
									cssBundle,
								)}" for entrypoint "${entrypoint}"`,
								{ scope: "plugin:css", level: "verbose" },
							);
							bundles.push({ cssBundle, entrypoint, type: "page" });
						}
					}
				}

				const globalBundles = await Promise.all(
					getGlobalCss(context.buildConfig, options.globalCss),
				);

				bundles.unshift(
					...globalBundles.map(
						/** @returns {Bundle} */ (cssBundle) => ({
							cssBundle,
							type: "global",
						}),
					),
				);

				const cssBundler = Bundler.create(compiler, context.buildConfig, scope);

				/** @type {esbuild.BuildOptions} */
				const userOptions = { ...build.initialOptions, ...options.esbuildOptions };

				const bundleResult = await cssBundler.bundle(bundles, {
					entryNames: "[dir]/[name]-[hash]",
					chunkNames: "[dir]/[name]-[hash]",
					assetNames: "[dir]/[name]-[hash]",
					format: "esm",
					...userOptions,
					target:
						userOptions?.target === undefined || userOptions.target === "es6-modules"
							? ["es2020", "edge88", "firefox78", "chrome87", "safari14"]
							: userOptions.target,
					define: {
						...userOptions?.define,
						"import.meta.environment": "'client'",
					},
					outdir: path.resolve(context.buildConfig.publicDir, outdir),
					plugins: [
						...(userOptions.plugins?.filter(
							(plugin) =>
								!(
									plugin.name.startsWith("frugal-internal-plugin:") ||
									plugin.name.startsWith("frugal:css") ||
									plugin.name.startsWith("frugal:script")
								),
						) ?? []),
						cleanOutDir(),
						output(),
					],
					bundle: true,
					absWorkingDir: context.buildConfig.rootDir,
					metafile: true,
				});

				for (const globalCss of bundleResult.global) {
					context.output("css", {
						type: "css",
						scope: "global",
						path: globalCss.src,
					});
				}
				for (const [entrypoint, pageCss] of Object.entries(bundleResult.page)) {
					context.output("css", {
						type: "css",
						scope: "page",
						entrypoint,
						path: pageCss.src,
					});
				}
			});

			build.onDispose(() => {
				compiler.dispose();
			});
		},
	};
}

/**
 * @param {InternalBuildConfig} config
 * @param {string[] | string | undefined} globalCss
 * @returns
 */
function getGlobalCss(config, globalCss) {
	if (globalCss === undefined) {
		return [];
	}
	if (typeof globalCss === "string") {
		return [path.resolve(config.rootDir, globalCss)];
	}
	return globalCss.map((globalCss) => path.resolve(config.rootDir, globalCss));
}
