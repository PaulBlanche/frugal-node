import * as path from "node:path";
import * as esbuild from "esbuild";
import { FrugalConfig } from "../../Config.js";
import * as fs from "../../utils/fs.js";
import { log } from "../../utils/log.js";

/**
 * @param {FrugalConfig} config
 * @param {boolean} [overrideCleanAllOutDir]
 * @returns {esbuild.Plugin}
 */
export function cleanOutdir(config, overrideCleanAllOutDir) {
	const cleanAllOutDir = overrideCleanAllOutDir ?? config.cleanAllOutDir;

	return {
		name: "frugal-internal:cleanOutdir",
		setup(build) {
			let isFirstBuild = true;

			const initialOptions = build.initialOptions;
			const cwd = initialOptions.absWorkingDir ?? process.cwd();
			const esbuildOutDir = path.resolve(cwd, initialOptions.outdir ?? ".");

			build.onStart(async () => {
				if (!isFirstBuild) {
					return;
				}

				try {
					if (cleanAllOutDir) {
						log(`clean directory ${config.outDir}`, {
							level: "debug",
							scope: "cleanOutdir",
						});

						const directory = await fs.readDir(config.outDir);
						for await (const entry of directory) {
							const entryPath = path.resolve(config.outDir, entry.name);
							if (!entry.isDirectory() || `${entryPath}/` !== config.cacheDir) {
								await fs.remove(entryPath, {
									recursive: true,
								});
							}
						}
					} else {
						log(`clean directory ${esbuildOutDir}`, {
							level: "debug",
							scope: "cleanOutdir",
						});

						await fs.remove(esbuildOutDir, {
							recursive: true,
						});
					}
				} catch (/** @type {any} */ error) {
					if (!(error instanceof fs.NotFound)) {
						throw error;
					}
				}

				isFirstBuild = false;
			});
		},
	};
}
