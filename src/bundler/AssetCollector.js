import * as esbuild from "esbuild";
import { FrugalConfig } from "../Config.js";
import * as path from "../utils/path.js";
import * as _type from "./_type/AssetCollector.js";

/** @typedef {_type.Asset} Asset */

export class AssetCollector {
	/** @type {esbuild.Metafile} */
	#metafile;
	/** @type {FrugalConfig} */
	#config;

	/**
	 * @param {FrugalConfig} config
	 * @param {esbuild.Metafile} metafile
	 */
	constructor(config, metafile) {
		this.#metafile = metafile;
		this.#config = config;
	}

	/**
	 * @param {RegExp} filter
	 * @returns {_type.Asset[]}
	 */
	collect(filter) {
		/** @type {_type.Asset[]} */
		const assets = [];

		const inputs = this.#metafile.inputs;

		const outputEntryPoints = this.#getOutputEntryPoints();

		for (const outputEntryPoint of outputEntryPoints) {
			const visited = new Set();
			const stack = [outputEntryPoint.entryPoint];

			/** @type {string | undefined} */
			let current = undefined;
			// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
			while ((current = stack.pop()) !== undefined) {
				if (visited.has(current)) {
					continue;
				}
				visited.add(current);

				if (filter.test(current)) {
					assets.push({
						entrypoint: outputEntryPoint.entryPoint,
						path: path.resolve(this.#config.rootDir, current),
					});
				}

				const input = inputs[current];

				for (const imported of input.imports) {
					if (imported.external) {
						continue;
					}

					stack.push(imported.path);
				}
			}
		}

		return assets.reverse();
	}

	/** @returns {_type.OutputEntryPoint[]} */
	#getOutputEntryPoints() {
		const outputs = this.#metafile.outputs;

		const outputEntryPoints = [];

		for (const [outputPath, output] of Object.entries(outputs)) {
			const entryPoint = output.entryPoint;
			if (entryPoint === undefined) {
				continue;
			}

			outputEntryPoints.push({ ...output, entryPoint, path: outputPath });
		}

		return outputEntryPoints;
	}
}
