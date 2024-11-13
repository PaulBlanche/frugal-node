/** @import * as self from "./script.js" */
/** @import * as esbuild from "esbuild" */

import * as path from "node:path";
import { PluginEsbuild, cleanOutDir, output } from "@frugal-node/core/plugin";
import { Bundler } from "./Bundler.js";

const DEFAULT_FILTER = /\.script.m?[tj]sx?$/;

/** @type {self.script} */
export function script(options = {}) {
	const outdir = options?.outdir ?? "js";
	const filter = options?.filter ?? DEFAULT_FILTER;

	return {
		name: "frugal:script",
		setup(build, context) {
			const esbuild = PluginEsbuild.create("js");

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (errors.length > 0 || metafile === undefined) {
					return;
				}

				const jsBundler = Bundler.create(esbuild, context.buildConfig);

				/** @type {esbuild.BuildOptions} */
				const userOptions = { ...build.initialOptions, ...options?.esbuildOptions };

				const bundleResult = await jsBundler.bundle(
					context.collectModules(filter, metafile),
					{
						entryNames: "[dir]/[name]-[hash]",
						chunkNames: "[dir]/[name]-[hash]",
						assetNames: "[dir]/[name]-[hash]",
						format: "esm",
						...userOptions,
						target:
							userOptions?.target === undefined ||
							userOptions.target === "es6-modules"
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
										plugin.name.startsWith("frugal:script")
									),
							) ?? []),
							cleanOutDir(),
							output(),
						],
						loader: { ...userOptions.loader, ".css": "empty" },
						outExtension: options?.esbuildOptions?.outExtension,
						platform: "browser",
						bundle: true,
						metafile: true,
						absWorkingDir: context.buildConfig.rootDir,
					},
				);

				for (const [entrypoint, scriptPath] of Object.entries(bundleResult)) {
					context.output("js", {
						type: "js",
						scope: "page",
						entrypoint,
						path: scriptPath,
					});
				}
			});

			build.onDispose(() => {
				esbuild.dispose();
			});
		},
	};
}
