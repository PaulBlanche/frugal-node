/** @import * as self from './cleanOutDir.js' */
/** @import * as esbuild from 'esbuild' */

import * as path from "node:path";
import * as fs from "../../utils/fs.js";

/** @type {self.cleanOutDir} */
export function cleanOutDir() {
	return {
		name: "frugal-internal-plugin:cleanOutdir",
		setup(build) {
			const initialOptions = build.initialOptions;
			const cwd = initialOptions.absWorkingDir ?? process.cwd();
			const outdir = path.resolve(cwd, initialOptions.outdir ?? ".");

			build.onEnd(async (buildResult) => {
				if (buildResult.metafile !== undefined) {
					await _cleanOutDirr(cwd, outdir, buildResult.metafile);
				}
			});
		},
	};
}

/**
 * @param {string} cwd
 * @param {string} outdir
 * @param {esbuild.Metafile} metafile
 */
async function _cleanOutDirr(cwd, outdir, metafile) {
	try {
		const directory = await fs.readDir(outdir);
		const outputFiles = Object.keys(metafile.outputs);
		outputFiles.push(path.relative(cwd, path.resolve(outdir, "meta.json")));

		/** @type {Promise<void>[]} */
		const removes = [];

		for await (const entry of directory) {
			const entryAbsolutePath = path.resolve(outdir, entry.name);
			const entryPath = path.relative(cwd, entryAbsolutePath);
			if (!outputFiles.includes(entryPath)) {
				removes.push(fs.remove(entryAbsolutePath, { recursive: true }));
			}
		}

		await Promise.all(removes);
	} catch (error) {
		// ignore not found, there is no directory to clean
		if (!(error instanceof fs.NotFound)) {
			throw error;
		}
	}
}
