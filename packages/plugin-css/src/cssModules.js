/** @import * as self from "./cssModules.js" */

import * as path from "node:path";
import * as url from "node:url";
import { Hash } from "@frugal-node/core/utils/Hash";
import * as fs from "@frugal-node/core/utils/fs";
import { CssModuleBundler } from "./CssModuleBundler.js";

/** @type {self.cssModules} */
export function cssModules(cssModule) {
	return {
		name: "frugal:css-module",
		setup(build, context) {
			if (!cssModule) {
				return;
			}

			const cssLoader = build.initialOptions.loader?.[".css"] ?? "css";

			const bundler = CssModuleBundler.create({
				sourceMap: Boolean(build.initialOptions.sourcemap),
				projectRoot: build.initialOptions.absWorkingDir,
				options: {
					pattern: typeof cssModule === "boolean" ? undefined : cssModule.pattern,
					dashedIdents:
						typeof cssModule === "boolean" ? undefined : cssModule.dashedIdents,
				},
			});

			/** @type {Map<string, Uint8Array>} */
			const compiledCssModuleCache = new Map();

			build.onResolve({ filter: /\.frugal-compiled-css-module\.css$/ }, (args) => {
				const relativePath = path.relative(context.buildConfig.rootDir, args.path);
				if (compiledCssModuleCache.has(relativePath)) {
					return {
						path: relativePath,
						namespace: "virtual",
					};
				}
			});

			build.onResolve({ filter: /cssModuleHelper:format\.js/ }, (args) => {
				return { path: "format.js", namespace: "cssModuleHelper" };
			});

			build.onLoad({ filter: /format\.js/, namespace: "cssModuleHelper" }, async (args) => {
				return {
					loader: "js",
					contents: await fs.readFile(
						url.fileURLToPath(new URL("./format.js", import.meta.url)),
					),
				};
			});

			build.onResolve({ filter: /\.module.css$/ }, (args) => {
				return {
					path: path.resolve(path.dirname(args.importer), args.path),
					namespace: args.namespace,
				};
			});

			build.onLoad(
				{ filter: /\.frugal-compiled-css-module\.css$/, namespace: "virtual" },
				(args) => {
					const contents = compiledCssModuleCache.get(args.path);
					return { loader: cssLoader, contents, resolveDir: path.dirname(args.path) };
				},
			);

			build.onLoad({ filter: /\.module.css$/ }, async (args) => {
				const contents = await fs.readFile(args.path);
				const contentHash = Hash.create().update(contents).digest();

				const cssPath = path.resolve(
					path.dirname(args.path),
					`${path.basename(args.path)}-${contentHash}.frugal-compiled-css-module.css`,
				);

				const module = await bundler.bundle(args.path, cssPath, contents);

				compiledCssModuleCache.set(
					path.relative(context.buildConfig.rootDir, cssPath),
					module.css,
				);

				return { loader: "js", contents: module.js };
			});
		},
	};
}
