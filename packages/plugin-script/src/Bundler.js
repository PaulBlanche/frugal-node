/** @import * as self from "./Bundler.js" */
/** @import { CollectedModule } from "@frugal-node/core/plugin" */
/** @import * as esbuild from "esbuild" */

import * as path from "node:path";
import { Hash } from "@frugal-node/core/utils/Hash";
import * as fs from "@frugal-node/core/utils/fs";

/** @type {self.BundlerCreator} */
export const Bundler = {
	create,
};

/** @type {self.BundlerCreator['create']} */
function create(compiler, config) {
	const state = {
		/** @type {self.Facade[]} */
		facades: [],
	};

	return {
		async bundle(modules, options) {
			await _writeFacades(modules);

			const bundleHash = state.facades
				.reduce((hash, facade) => {
					return hash.update(facade.path);
				}, Hash.create())
				.digest();

			const buildResult = await compiler.compile(bundleHash, {
				...options,
				entryPoints: state.facades.map((facade) => facade.path),
			});

			return _extractBundles(buildResult.metafile);
		},
	};

	/** @param {CollectedModule[]} modules */
	async function _writeFacades(modules) {
		/** @type {Record<string, self.Facade>} */
		const facadesMap = {};

		for (const asset of modules) {
			const entrypoint = asset.entrypoint;
			const facadePath = path.resolve(config.tempDir, `asset/script/${entrypoint}`);
			const facadeContent = `import "${asset.path}";`;
			facadesMap[entrypoint] = facadesMap[entrypoint] ?? {
				entrypoint,
				path: facadePath,
				content: [],
			};

			facadesMap[entrypoint].content.push(facadeContent);
		}

		state.facades = Object.values(facadesMap);

		await Promise.all(
			state.facades.map(async (facade) => {
				await fs.ensureFile(facade.path);
				await fs.writeTextFile(facade.path, facade.content.join("\n"));
			}),
		);
	}

	/**
	 * @param {esbuild.Metafile} metafile
	 * @returns
	 */
	async function _extractBundles(metafile) {
		/** @type {Record<string, { url:string, size:number}>} */
		const generated = {};

		const outputs = Object.entries(metafile.outputs);

		for (const [outputPath, output] of outputs) {
			if (output.entryPoint === undefined) {
				continue;
			}

			const outputEntrypointPath = path.resolve(config.rootDir, output.entryPoint);

			const facade = state.facades.find((facade) => facade.path === outputEntrypointPath);

			if (facade === undefined) {
				continue;
			}

			const jsBundlePath = path.resolve(config.rootDir, outputPath);
			const bundleName = path.relative(config.publicDir, jsBundlePath);

			generated[facade.entrypoint] = { url: `/${bundleName}`, size: output.bytes };
		}

		return generated;
	}
}
