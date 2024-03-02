import * as esbuild from "esbuild";
import { log } from "../utils/log.js";

/** @type {import('./EsbuildCompiler.ts').Maker} */
export const EsbuildCompiler = {
	create,
};

/** @type {import('./EsbuildCompiler.ts').Maker['create']} */
function create(name) {
	const state = {
		/** @type {import('./EsbuildCompiler.ts').ContextCache | undefined} */
		contextCache: undefined,
	};

	return {
		async compile(hash, options) {
			const context = await _getContext(options, hash);

			return context.rebuild();
		},

		async dispose() {
			await state.contextCache?.context.dispose();
		},
	};

	/**
	 * @param {esbuild.BuildOptions} options
	 * @param {string} hash
	 * @returns {Promise<import('./EsbuildCompiler.ts').EsbuildContext>}
	 */
	async function _getContext(options, hash) {
		if (state.contextCache?.id !== hash) {
			if (state.contextCache !== undefined) {
				log("entrypoints list has changed, recreate esbuild context", {
					level: "debug",
					scope: `plugin:Compiler:${name}`,
				});

				await state.contextCache.context.dispose();
			}
			state.contextCache = {
				id: hash,
				context: await esbuild.context(options),
			};

			log(`Esbuild config:\n${JSON.stringify(options, undefined, 2)}`, {
				level: "verbose",
				scope: `plugin:Compiler:${name}`,
			});
		}

		return state.contextCache.context;
	}
}
