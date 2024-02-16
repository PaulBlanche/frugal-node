import * as path from "node:path";
import * as esbuild from "esbuild";
import { FrugalConfig } from "../Config.js";
import * as fs from "../utils/fs.js";
import * as hash from "../utils/hash.js";
import * as _type from "./_type/MetafileAnalyser.js";

export class MetafileAnalyser {
	/** @type {FrugalConfig} */
	#config;
	/** @type {esbuild.Metafile} */
	#metafile;

	/**
	 * @param {esbuild.Metafile} metafile
	 * @param {FrugalConfig} config
	 */
	constructor(metafile, config) {
		this.#metafile = metafile;
		this.#config = config;
	}

	/**
	 * @param {string} outputPath
	 * @param {esbuild.Metafile["outputs"][string]} output
	 */
	async analyse(outputPath, output) {
		if (output.entryPoint === undefined) {
			return undefined;
		}

		const entryPointPath = path.resolve(this.#config.rootDir, output.entryPoint);
		const page = this.#config.pages.find((page) => page === entryPointPath);

		if (page !== undefined) {
			return await this.#analysePage(output.entryPoint, outputPath);
		}

		if (entryPointPath === this.#config.self) {
			return await this.#analyseConfig(output.entryPoint);
		}

		if (entryPointPath.endsWith(".css")) {
			return await this.#analyseCss(output.entryPoint);
		}
	}

	/**
	 * @param {string} entrypoint
	 * @param {string} output
	 * @returns {Promise<_type.Analysis>}
	 */
	async #analysePage(entrypoint, output) {
		return {
			type: "page",
			entrypoint,
			output,
			moduleHash: await this.#moduleHash(entrypoint),
		};
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<_type.Analysis>}
	 */
	async #analyseConfig(entrypoint) {
		return {
			type: "config",
			moduleHash: await this.#moduleHash(entrypoint),
		};
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<_type.Analysis>}
	 */
	async #analyseCss(entrypoint) {
		return {
			type: "css",
			moduleHash: await this.#moduleHash(entrypoint),
		};
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<string>}
	 */
	async #moduleHash(entrypoint) {
		const dependencies = [];
		dependencies.push({
			input: entrypoint,
			namespace: "file:",
			path: path.resolve(this.#config.rootDir, entrypoint),
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

			const input = this.#metafile.inputs[current.input];
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
							? path.resolve(this.#config.rootDir, parsed.path)
							: parsed.path,
				};

				dependencies.push(dep);
				stack.push(dep);
			}
		}

		const hasher = hash.create();

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
