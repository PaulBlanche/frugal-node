import * as path from "node:path";
import * as esbuild from "esbuild";
import { FrugalConfig } from "frugal/config";
import * as plugin from "frugal/plugin";
import * as fs from "frugal/utils/fs";
import * as hash from "frugal/utils/hash";
import * as _type from "./_type/Bundler.js";

export class Bundler {
	/** @type {FrugalConfig} */
	#config;
	/** @type {plugin.Compiler} */
	#compiler;
	/** @type {_type.Facade[]} */
	#facades;

	/**
	 * @param {plugin.Compiler} compiler
	 * @param {FrugalConfig} config
	 */
	constructor(compiler, config) {
		this.#compiler = compiler;
		this.#facades = [];
		this.#config = config;
	}

	/**
	 * @param {plugin.Asset[]} assets
	 * @param {Omit<esbuild.BuildOptions, "entryPoints">} options
	 */
	async bundle(assets, options) {
		await this.#writeFacades(assets);

		const bundleHash = this.#facades
			.reduce((hash, facade) => {
				return hash.update(facade.path);
			}, hash.create())
			.digest();

		const buildResult = await this.#compiler.compile(bundleHash, {
			...options,
			entryPoints: this.#facades.map((facade) => facade.path),
		});

		return this.#extractBundles(buildResult.metafile);
	}

	/** @param {plugin.Asset[]} assets */
	async #writeFacades(assets) {
		/** @type {Record<string, _type.Facade>} */
		const facadesMap = {};

		for (const asset of assets) {
			const entrypoint = asset.entrypoint;
			const facadePath = path.resolve(this.#config.tempDir, `asset/script/${entrypoint}`);
			const facadeContent = `import "${asset.path}";`;
			facadesMap[entrypoint] = facadesMap[entrypoint] ?? {
				entrypoint,
				path: facadePath,
				content: [],
			};

			facadesMap[entrypoint].content.push(facadeContent);
		}

		this.#facades = Object.values(facadesMap);

		await Promise.all(
			this.#facades.map(async (facade) => {
				await fs.ensureFile(facade.path);
				await fs.writeTextFile(facade.path, facade.content.join("\n"));
			}),
		);
	}

	/**
	 * @param {esbuild.Metafile} metafile
	 * @returns
	 */
	#extractBundles(metafile) {
		/** @type {Record<string, string>} */
		const generated = {};

		const outputs = Object.entries(metafile.outputs);

		for (const [outputPath, output] of outputs) {
			if (output.entryPoint === undefined) {
				continue;
			}

			const outputEntrypointPath = path.resolve(this.#config.rootDir, output.entryPoint);

			const facade = this.#facades.find((facade) => facade.path === outputEntrypointPath);

			if (facade === undefined) {
				continue;
			}

			const jsBundlePath = path.resolve(this.#config.rootDir, outputPath);
			const bundleName = path.relative(this.#config.publicDir, jsBundlePath);

			generated[facade.entrypoint] = `/${bundleName}`;
		}

		return generated;
	}
}
