import * as path from "node:path";
import * as url from "node:url";
import * as esbuild from "esbuild";
import { FrugalConfig } from "frugal-node/config";
import * as plugin from "frugal-node/plugin";
import * as fs from "frugal-node/utils/fs";
import * as hash from "frugal-node/utils/hash";
import { log } from "frugal-node/utils/log";
import { Bundler } from "./Bundler.js";
import * as _type from "./_type/css.js";
import { cssModules } from "./cssModules.js";

/** @typedef {_type.CssOptions} CssOptions */

/**
 * @param {_type.CssOptions} options
 * @returns {plugin.Plugin}
 */
export function css({
	outdir = "css/",
	scope = "page",
	esbuildOptions,
	globalCss,
	cssModule = false,
} = {}) {
	const cssModulesPlugin = cssModules(cssModule);

	return {
		name: "frugal:css",
		setup(build, context) {
			const compiler = new plugin.Compiler("css");

			if (cssModule) {
				cssModulesPlugin.setup(build, context);
			}

			build.onResolve({ filter: /^[^\.\/].*\.css$/ }, (args) => {
				return { path: url.fileURLToPath(import.meta.resolve(args.path)) };
			});

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (metafile === undefined || errors.length !== 0) {
					return;
				}

				/** @type {_type.Bundle[]} */
				const bundles = [];

				for (const outputPath of Object.keys(metafile.outputs)) {
					const output = metafile.outputs[outputPath];
					const cssBundle = output.cssBundle;
					const entrypoint = output.entryPoint;
					if (entrypoint) {
						if (cssBundle) {
							log(
								`Found css bundle "${path.relative(
									context.config.rootDir,
									cssBundle,
								)}" for entrypoint "${entrypoint}"`,
								{ scope: "plugin:css", level: "verbose" },
							);
							bundles.push({ cssBundle, entrypoint, type: "page" });
						}
					}
				}

				const globalBundles = await Promise.all(
					getGlobalCss(context.config, globalCss).map(async (globalCss) => {
						const ext = path.extname(globalCss);
						const name = `${path.basename(globalCss, ext)}-${hash
							.create()
							.update(globalCss)
							.digest()}${ext}`;
						const cssBundle = path.resolve(context.config.buildDir, name);
						await fs.copy(globalCss, cssBundle);
						return path.relative(context.config.rootDir, cssBundle);
					}),
				);

				bundles.unshift(
					...globalBundles.map(
						/** @returns {_type.Bundle} */ (cssBundle) => ({
							cssBundle,
							type: "global",
						}),
					),
				);

				const bundler = new Bundler(compiler, context.config, scope);

				/** @type {esbuild.BuildOptions} */
				const userOptions = { ...build.initialOptions, ...esbuildOptions };

				const bundleResult = await bundler.bundle(bundles, {
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
					outdir: path.resolve(context.config.publicDir, outdir),
					plugins: [
						...(userOptions.plugins?.filter(
							(plugin) =>
								!plugin.name.startsWith("frugal-internal:") &&
								!plugin.name.startsWith("frugal:css") &&
								!plugin.name.startsWith("frugal:script"),
						) ?? []),
						plugin.cleanOutdir(context.config, false),
						plugin.output(),
					],
					bundle: true,
					absWorkingDir: context.config.rootDir,
					metafile: true,
				});

				for (const globalCss of bundleResult.global) {
					context.output("css", {
						type: "css",
						scope: "global",
						path: globalCss,
					});
				}
				for (const [entrypoint, pageCss] of Object.entries(bundleResult.page)) {
					context.output("css", {
						type: "css",
						scope: "page",
						entrypoint,
						path: pageCss,
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
 * @param {FrugalConfig} config
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
