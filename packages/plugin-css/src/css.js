import * as path from "node:path";
import * as url from "node:url";
import * as esbuild from "esbuild";
import { EsbuildCompiler, cleanOutDir, output } from "frugal-node/plugin";
import * as fs from "frugal-node/utils/fs";
import { Hash } from "frugal-node/utils/hash";
import { log } from "frugal-node/utils/log";
import { Bundler } from "./Bundler.js";
import { cssModules } from "./cssModules.js";

/** @type {import('./css.ts').css} */
export function css(options = {}) {
	const outdir = options?.outdir ?? "css/";
	const scope = options?.scope ?? "page";
	const cssModule = options?.cssModule ?? false;

	const cssModulesPlugin = cssModules(cssModule);

	return {
		name: "frugal:css",
		setup(build, context) {
			const compiler = EsbuildCompiler.create("css");

			if (cssModule) {
				cssModulesPlugin.setup(build, context);
			}

			build.onResolve({ filter: /^[^\.\/].*\.css$/ }, (args) => {
				return { path: url.fileURLToPath(new URL(args.path, import.meta.url)) };
			});

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (metafile === undefined || errors.length !== 0) {
					return;
				}

				/** @type {import("./Bundler.js").Bundle[]} */
				const bundles = [];

				for (const outputPath of Object.keys(metafile.outputs)) {
					const output = metafile.outputs[outputPath];
					const cssBundle = output.cssBundle;
					const entrypoint = output.entryPoint;
					if (entrypoint) {
						if (cssBundle) {
							log(
								`Found css bundle "${path.relative(
									context.config.global.rootDir,
									cssBundle,
								)}" for entrypoint "${entrypoint}"`,
								{ scope: "plugin:css", level: "verbose" },
							);
							bundles.push({ cssBundle, entrypoint, type: "page" });
						}
					}
				}

				const globalBundles = await Promise.all(
					getGlobalCss(context.config.global, options.globalCss).map(
						async (globalCss) => {
							const ext = path.extname(globalCss);
							const name = `${path.basename(globalCss, ext)}-${Hash.create()
								.update(globalCss)
								.digest()}${ext}`;
							const cssBundle = path.resolve(context.config.global.buildDir, name);
							await fs.copy(globalCss, cssBundle);
							return path.relative(context.config.global.rootDir, cssBundle);
						},
					),
				);

				bundles.unshift(
					...globalBundles.map(
						/** @returns {import("./Bundler.js").Bundle} */ (cssBundle) => ({
							cssBundle,
							type: "global",
						}),
					),
				);

				const cssBundler = Bundler.create(compiler, context.config.global, scope);

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
					outdir: path.resolve(context.config.global.publicDir, outdir),
					plugins: [
						...(userOptions.plugins?.filter(
							(plugin) =>
								!plugin.name.startsWith("frugal-internal:") &&
								!plugin.name.startsWith("frugal:css") &&
								!plugin.name.startsWith("frugal:script"),
						) ?? []),
						cleanOutDir(context.config, false),
						output(),
					],
					bundle: true,
					absWorkingDir: context.config.global.rootDir,
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
 * @param {import("frugal-node/plugin").FrugalConfig} config
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
