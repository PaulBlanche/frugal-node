import * as path from "node:path";
import { commonPath } from "frugal-node/utils/commonPath";
import { Hash } from "frugal-node/utils/hash";

/** @type {import('./Bundler.ts').BundlerMaker} */
export const Bundler = {
	create,
};

/** @type {import('./Bundler.ts').BundlerMaker['create']} */
export function create(compiler, config, scope) {
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
	 * @param {import('./Bundler.ts').Bundle[]} bundles
	 * @param {import('esbuild').Metafile} metafile
	 */
	function _extractBundles(bundles, metafile) {
		/** @type {Record<string, string>} */
		const stylesheets = {};
		/** @type {string[]} */
		const globalStylesheets = [];

		for (const [outputPath, output] of Object.entries(metafile.outputs)) {
			const bundle = bundles.find((bundle) => bundle.cssBundle === output.entryPoint);

			const cssBundlePath = path.relative(
				config.publicDir,
				path.resolve(config.rootDir, outputPath),
			);

			if (bundle === undefined || bundle.type === "global") {
				globalStylesheets.push(`/${cssBundlePath}`);
			} else {
				stylesheets[bundle.entrypoint] = `/${cssBundlePath}`;
			}
		}

		return { global: globalStylesheets, page: stylesheets };
	}
}

/** @param {string} path */
function nameWithoutHash(path) {
	return path.replace(/-[A-Z0-9]+(\..*)$/, (_, extension) => {
		return extension;
	});
}
