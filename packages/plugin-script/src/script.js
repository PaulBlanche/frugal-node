import * as path from "node:path";
import * as esbuild from "esbuild";
import { EsbuildCompiler, cleanOutDir, output } from "frugal-node/plugin";
import { Bundler } from "./Bundler.js";

/** @type {import('./script.ts').script} */
export function script(options = {}) {
	const outdir = options?.outdir ?? "js";
	const filter = options?.filter ?? /\.script.m?[tj]sx?$/;

	return {
		name: "frugal:script",
		setup(build, context) {
			const compiler = EsbuildCompiler.create("js");

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (errors.length !== 0 || metafile === undefined) {
					return;
				}

				const jsBundler = Bundler.create(compiler, context.config.global);

				/** @type {esbuild.BuildOptions} */
				const userOptions = { ...build.initialOptions, ...options?.esbuildOptions };

				const bundleResult = await jsBundler.bundle(context.collect(filter, metafile), {
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
								!plugin.name.startsWith("frugal:script"),
						) ?? []),
						cleanOutDir(context.config, false),
						output(),
					],
					loader: { ...userOptions.loader, ".css": "empty" },
					outExtension: options?.esbuildOptions?.outExtension,
					platform: "browser",
					bundle: true,
					metafile: true,
					absWorkingDir: context.config.global.rootDir,
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
