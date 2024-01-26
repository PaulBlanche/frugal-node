import * as _type from "./_type/Bundler.js";

import * as esbuild from "esbuild";
import * as fs from "../../utils/fs.js";
import * as path from "../../utils/path.js";

import { FrugalConfig } from "../../Config.js";
import * as assetCollector from "../../bundler/AssetCollector.js";
import { Compiler } from "../Compiler.js";

export class Bundler {
	/** @type {FrugalConfig} */
	#config;
	/** @type {Compiler} */
	#compiler;
	/** @type {_type.Facade[]} */
	#facades;

	/**
	 * @param {Compiler} compiler
	 * @param {FrugalConfig} config
	 */
	constructor(compiler, config) {
		this.#compiler = compiler;
		this.#facades = [];
		this.#config = config;
	}

	/**
	 * @param {assetCollector.Asset[]} assets
	 * @param {Omit<esbuild.BuildOptions, "entryPoints">} options
	 */
	async bundle(assets, options) {
		await this.#writeFacades(assets);

		const buildResult = await this.#compiler.compile({
			...options,
			entryPoints: this.#facades.map((facade) => facade.path),
		});

		return this.#extractBundles(buildResult.metafile);
	}

	/** @param {assetCollector.Asset[]} assets */
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
