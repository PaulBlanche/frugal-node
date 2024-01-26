import * as _type from "./_type/script.js";

import * as esbuild from "esbuild";
import * as plugin from "../../bundler/Plugin.js";
import { cleanOutdir } from "../../bundler/plugins/cleanOutDir.js";
import { output } from "../../bundler/plugins/output.js";
import * as path from "../../utils/path.js";
import { Compiler } from "../Compiler.js";
import { Bundler } from "./Bundler.js";

/** @typedef {_type.ScriptOptions} ScriptOptions */

/**
 * @param {Partial<_type.ScriptOptions>} [param0]
 * @returns {plugin.Plugin}
 */
export function script({ outdir = "js/", esbuildOptions, filter = /\.script.m?[tj]sx?$/ } = {}) {
	return {
		name: "frugal:script",
		setup(build, context) {
			const compiler = new Compiler("js");

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (errors.length !== 0 || metafile === undefined) {
					return;
				}

				const bundler = new Bundler(compiler, context.config);

				/** @type {esbuild.BuildOptions} */
				const userOptions = { ...build.initialOptions, ...esbuildOptions };

				const bundleResult = await bundler.bundle(context.collect(filter, metafile), {
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
								!plugin.name.startsWith("frugal:script"),
						) ?? []),
						cleanOutdir(context.config, false),
						output(),
					],
					loader: { ...userOptions.loader, ".css": "empty" },
					bundle: true,
					metafile: true,
					absWorkingDir: context.config.rootDir,
				});

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
				compiler.dispose();
			});
		},
	};
}
