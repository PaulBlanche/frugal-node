/** @import * as self from "./Bundler.js" */
/** @import * as esbuild from "esbuild" */

import * as path from "node:path";
import { Hash } from "@frugal-node/core/utils/Hash";
import { commonPath } from "./commonPath.js";

/** @type {self.BundlerCreator} */
export const Bundler = {
	create,
};

/** @type {self.BundlerCreator['create']} */
function create(compiler, config, scope) {
	return {
		async bundle(bundles, options) {
			const commonRoot = commonPath(bundles.map((bundle) => bundle.cssBundle));

			if (options.loader?.[".css"] === "empty") {
				return { global: [], page: {} };
			}

			const bundleHash = bundles
				.reduce((hash, bundle) => {
					return hash.update(bundle.cssBundle);
				}, Hash.create())
				.digest();

			const compileResult = await compiler.compile(bundleHash, {
				...options,
				entryPoints:
					scope === "page"
						? bundles.map((bundle) => {
								const name = nameWithoutHash(
									path.relative(commonRoot, bundle.cssBundle),
								);
								return {
									in: bundle.cssBundle,
									out: path.basename(name, path.extname(name)),
								};
							})
						: undefined,
				stdin:
					scope === "global"
						? {
								contents: bundles
									.map((bundle) => {
										return `@import "${bundle.cssBundle}";`;
									})
									.join("\n"),
								resolveDir: config.rootDir,
								sourcefile: "global-facade.css",
								loader: options.loader?.[".css"] ?? "css",
							}
						: undefined,
			});

			return _extractBundles(bundles, compileResult.metafile);
		},
	};

	/**
	 * @param {self.Bundle[]} bundles
	 * @param {esbuild.Metafile} metafile
	 */
	function _extractBundles(bundles, metafile) {
		/** @type {Record<string, { src:string, sourceMap?:string, size:number }>} */
		const stylesheets = {};
		/** @type {{ src:string, sourceMap?:string, size:number}[]} */
		const globalStylesheets = [];

		/** @type {Record<string, {src?:string, sourceMap?:string, size:number} & ({ type?:'global', entrypoint?:undefined } | { type?:'page', entrypoint?: string})>} */
		const styles = {};

		for (const [outputPath, output] of Object.entries(metafile.outputs)) {
			const bundle = bundles.find((bundle) => bundle.cssBundle === output.entryPoint);

			const relativeOutputPath = path.relative(
				config.publicDir,
				path.resolve(config.rootDir, outputPath),
			);

			if (outputPath.endsWith(".map")) {
				const cssPath = outputPath.slice(0, -4);
				styles[cssPath] = styles[cssPath] ?? {};
				styles[cssPath].sourceMap = relativeOutputPath;
			} else if (bundle === undefined || bundle.type === "global") {
				styles[outputPath] = styles[outputPath] ?? {};
				styles[outputPath].type = "global";
				styles[outputPath].src = relativeOutputPath;
				styles[outputPath].size = output.bytes;
			} else {
				styles[outputPath] = styles[outputPath] ?? {};
				styles[outputPath].type = "page";
				styles[outputPath].src = relativeOutputPath;
				styles[outputPath].entrypoint = bundle.entrypoint;
				styles[outputPath].size = output.bytes;
			}
		}

		for (const style of Object.values(styles)) {
			if (style.type === "global" && style.src !== undefined) {
				globalStylesheets.push({
					src: `/${style.src}`,
					sourceMap: style.sourceMap && `/${style.sourceMap}`,
					size: style.size,
				});
			}

			if (
				style.type === "page" &&
				style.src !== undefined &&
				style.entrypoint !== undefined
			) {
				stylesheets[style.entrypoint] = {
					src: `/${style.src}`,
					sourceMap: style.sourceMap && `/${style.sourceMap}`,
					size: style.size,
				};
			}
		}

		return { global: globalStylesheets, page: stylesheets };
	}
}

const HASH_REGEXP = /-[A-Z0-9]+(\..*)$/;

/** @param {string} path */
function nameWithoutHash(path) {
	return path.replace(HASH_REGEXP, (_, extension) => {
		return extension;
	});
}
