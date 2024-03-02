import * as path from "node:path";
import * as fs from "frugal-node/utils/fs";
import { Hash } from "frugal-node/utils/hash";

/** @type {import('./Bundler.ts').BundlerMaker} */
export const Bundler = {
	create,
};

/** @type {import('./Bundler.ts').BundlerMaker['create']} */
export function create(compiler, config) {
	const state = {
		/** @type {import("./Bundler.ts").Facade[]} */
		facades: [],
	};

	return {
		async bundle(assets, options) {
			await _writeFacades(assets);

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

	/** @param {import("frugal-node/plugin").Asset[]} assets */
	async function _writeFacades(assets) {
		/** @type {Record<string, import("./Bundler.ts").Facade>} */
		const facadesMap = {};

		for (const asset of assets) {
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
	 * @param {import("esbuild").Metafile} metafile
	 * @returns
	 */
	async function _extractBundles(metafile) {
		/** @type {Record<string, string>} */
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

			generated[facade.entrypoint] = `/${bundleName}`;
		}

		return generated;
	}
}
