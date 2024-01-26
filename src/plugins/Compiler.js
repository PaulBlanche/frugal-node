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

	/** @param {esbuild.BuildOptions} options */
	async compile(options) {
		const context = await this.#getContext(options);

		return context.rebuild();
	}

	async dispose() {
		this.#contextCache?.context.dispose();
	}

	/**
	 * @param {esbuild.BuildOptions} options
	 * @returns {Promise<_type.EsbuildContext>}
	 */
	async #getContext(options) {
		const id = getId(options);

		if (this.#contextCache?.id !== id) {
			if (this.#contextCache !== undefined) {
				log("entrypoints list has changed, recreate esbuild context", {
					level: "debug",
					scope: `plugin:Compiler:${this.#name}`,
				});

				await this.#contextCache.context.dispose();
			}
			this.#contextCache = {
				id,
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

/** @param {esbuild.BuildOptions} options */
function getId(options) {
	if (!options.entryPoints) {
		return "";
	}

	if (Array.isArray(options.entryPoints)) {
		return options.entryPoints
			.slice()
			.map((entrypoint) => (typeof entrypoint === "string" ? entrypoint : entrypoint.in))
			.sort()
			.join("");
	}

	return Object.values(options.entryPoints).slice().sort().join("");
}
