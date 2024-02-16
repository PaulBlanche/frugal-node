import * as esbuild from "esbuild";
import { log } from "../utils/log.js";
import * as _type from "./_type/Compiler.js";

export class Compiler {
	/** @type {_type.ContextCache | undefined} */
	#contextCache;
	/** @type {string} */
	#name;

	/** @param {string} name */
	constructor(name) {
		this.#name = name;
	}

	/**
	 * @param {string} hash
	 * @param {esbuild.BuildOptions} options
	 */
	async compile(hash, options) {
		const context = await this.#getContext(options, hash);

		return context.rebuild();
	}

	async dispose() {
		this.#contextCache?.context.dispose();
	}

	/**
	 * @param {esbuild.BuildOptions} options
	 * @param {string} hash
	 * @returns {Promise<_type.EsbuildContext>}
	 */
	async #getContext(options, hash) {
		if (this.#contextCache?.id !== hash) {
			if (this.#contextCache !== undefined) {
				log("entrypoints list has changed, recreate esbuild context", {
					level: "debug",
					scope: `plugin:Compiler:${this.#name}`,
				});

				await this.#contextCache.context.dispose();
			}
			this.#contextCache = {
				id: hash,
				context: await esbuild.context(options),
			};

			log(`Esbuild config:\n${JSON.stringify(options, undefined, 2)}`, {
				level: "verbose",
				scope: `plugin:Compiler:${this.#name}`,
			});
		}

		return this.#contextCache.context;
	}
}
