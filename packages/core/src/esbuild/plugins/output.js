/** @import * as self from "./output.js" */

import * as path from "node:path";
import * as fs from "../../utils/fs.js";

/** @type {self.output} */
export function output() {
	return {
		name: "frugal-internal-plugin:output",
		setup(build) {
			const initialOptions = build.initialOptions;
			const cwd = initialOptions.absWorkingDir ?? process.cwd();
			const outdir = initialOptions.outdir ?? ".";
			const outdirPath = path.resolve(cwd, outdir);

			const metafilePath = path.resolve(outdirPath, "meta.json");

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const outputFiles = result.outputFiles;

				if (metafile) {
					await fs.ensureFile(metafilePath);
					await fs.writeTextFile(metafilePath, JSON.stringify(metafile));
				}

				if (outputFiles) {
					await Promise.all(
						outputFiles.map(async (out) => {
							try {
								await fs.ensureDir(path.dirname(out.path));
								await fs.writeFile(out.path, out.contents, {
									createNew: true,
								});
							} catch (/** @type {any} */ error) {
								if (!(error instanceof fs.AlreadyExists)) {
									throw error;
								}
							}
						}),
					);
				}
			});
		},
	};
}
