import * as path from "node:path";
import * as esbuild from "esbuild";
import { FrugalConfig } from "frugal/config";
import { Compiler } from "frugal/plugin";
import { commonPath } from "frugal/utils/commonPath";
import * as hash from "frugal/utils/hash";
import * as _type from "./_type/css.js";

export class Bundler {
	/** @type {Compiler} */
	#compiler;
	/** @type {FrugalConfig} */
	#config;
	/** @type {"page" | "global"} */
	#scope;

	/**
	 * @param {Compiler} compiler
	 * @param {FrugalConfig} config
	 * @param {"page" | "global"} scope
	 */
	constructor(compiler, config, scope) {
		this.#compiler = compiler;
		this.#config = config;
		this.#scope = scope;
	}

	/**
	 * @param {_type.Bundle[]} bundles
	 * @param {Omit<esbuild.BuildOptions, "entryPoints">} options
	 */
	async bundle(bundles, options) {
		const commonRoot = commonPath(bundles.map((bundle) => bundle.cssBundle));

		if (options.loader?.[".css"] === "empty") {
			return { global: [], page: {} };
		}

		const bundleHash = bundles
			.reduce((hash, bundle) => {
				return hash.update(bundle.cssBundle);
			}, hash.create())
			.digest();

		const compileResult = await this.#compiler.compile(bundleHash, {
			...options,
			entryPoints:
				this.#scope === "page"
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
				this.#scope === "global"
					? {
							contents: bundles
								.map((bundle) => {
									return `@import "${bundle.cssBundle}";`;
								})
								.join("\n"),
							resolveDir: this.#config.rootDir,
							sourcefile: "global-facade.css",
							loader: options.loader?.[".css"] ?? "css",
					  }
					: undefined,
		});

		return this.#extractBundles(bundles, compileResult.metafile);
	}

	/**
	 * @param {_type.Bundle[]} bundles
	 * @param {esbuild.Metafile} metafile
	 */
	#extractBundles(bundles, metafile) {
		/** @type {Record<string, string>} */
		const stylesheets = {};
		/** @type {string[]} */
		const globalStylesheets = [];

		for (const [outputPath, output] of Object.entries(metafile.outputs)) {
			const bundle = bundles.find((bundle) => bundle.cssBundle === output.entryPoint);

			const cssBundlePath = path.relative(
				this.#config.publicDir,
				path.resolve(this.#config.rootDir, outputPath),
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
