import * as esbuild from "esbuild";
import * as fs from "../../utils/fs.js";

import { FrugalConfig } from "../../Config.js";

/**
 * @param {FrugalConfig} config
 * @returns {esbuild.Plugin}
 */
export function copyStatic(config) {
	return {
		name: "frugal-internal:copyStatic",
		setup(build) {
			build.onEnd(async () => {
				try {
					await fs.copy(config.staticDir, config.publicDir, {
						overwrite: true,
						recursive: true,
					});
				} catch (/** @type {any} */ error) {
					if (!(error instanceof fs.NotFound)) {
						throw error;
					}
				}
			});
		},
	};
}
