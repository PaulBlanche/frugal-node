/** @import * as self from "./MetafileAnalyser.js" */
import * as path from "node:path";
import { Hash } from "../utils/Hash.js";
import * as fs from "../utils/fs.js";

/** @type {self.MetafileAnalyserCreator} */
export const MetafileAnalyser = {
	create,
};

/** @type {self.MetafileAnalyserCreator['create']} */
function create(metafile, config) {
	return {
		async analyse(outputPath, output) {
			if (output.entryPoint === undefined) {
				return undefined;
			}

			const entryPointPath = path.resolve(config.rootDir, output.entryPoint);
			const page = config.pages.find((page) => page === entryPointPath);

			if (page !== undefined) {
				return await _analysePage(output.entryPoint, outputPath);
			}

			if (entryPointPath === config.runtimeConfigPath) {
				return await _analyseConfig(output.entryPoint, outputPath);
			}

			return undefined;
		},
	};

	/**
	 * @param {string} entrypoint
	 * @param {string} output
	 * @returns {Promise<self.Analysis>}
	 */
	async function _analysePage(entrypoint, output) {
		return {
			type: "page",
			entrypoint,
			output,
			moduleHash: await _moduleHash(entrypoint),
		};
	}

	/**
	 * @param {string} entrypoint
	 * @param {string} output
	 * @returns {Promise<self.Analysis>}
	 */
	async function _analyseConfig(entrypoint, output) {
		return {
			type: "config",
			output,
			moduleHash: await _moduleHash(entrypoint),
		};
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<string>}
	 */
	async function _moduleHash(entrypoint) {
		const dependencies = [];
		dependencies.push({
			input: entrypoint,
			namespace: "file:",
			path: path.resolve(config.rootDir, entrypoint),
		});

		const seen = new Set();
		const stack = [...dependencies];

		let current = undefined;
		// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a stack (push to the array, pop from the array)
		while ((current = stack.pop()) !== undefined) {
			if (seen.has(current.input)) {
				continue;
			}
			seen.add(current.input);

			const input = metafile.inputs[current.input];
			for (const imported of input.imports) {
				if (imported.external || !imported.original) {
					continue;
				}

				const parsed = parsePath(imported.path);

				const dep = {
					input: imported.path,
					namespace: parsed.namespace,
					path:
						parsed.namespace === "file:"
							? path.resolve(config.rootDir, parsed.path)
							: parsed.path,
				};

				dependencies.push(dep);
				stack.push(dep);
			}
		}

		const hasher = Hash.create();

		const contents = [];

		// no "parallel" await to ensure deps are hashed in a deterministic order
		for (const dep of dependencies) {
			const a = await getDependencyContent(dep);
			contents.push(a);
			hasher.update(a);
		}

		return hasher.digest();
	}
}

const ENCODER = new TextEncoder();

/**
 * @param {{ namespace: string; path: string }} dep
 * @returns
 */
async function getDependencyContent(dep) {
	if (dep.namespace === "file:") {
		return await fs.readFile(dep.path);
	}
	return ENCODER.encode(`${dep.namespace}//${dep.path}`);
}

/**
 * @param {string} importPath
 * @returns
 */
function parsePath(importPath) {
	try {
		const url = new URL(importPath);
		return {
			namespace: url.protocol,
			path: url.pathname,
		};
	} catch {
		return {
			namespace: "file:",
			path: importPath,
		};
	}
}
