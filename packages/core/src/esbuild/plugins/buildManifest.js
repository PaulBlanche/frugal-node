/** @import * as self from "./buildManifest.js" */
/** @import { WritableManifest } from "../../build/manifest.js" */

import { MetafileAnalyser } from "../MetafileAnalyser.js";

/** @type {self.buildManifest} */
export function buildManifest(context) {
	return {
		name: "frugal-internal-plugin:buildManifest",
		setup(build) {
			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (errors.length > 0 || metafile === undefined) {
					return;
				}

				const analyser = MetafileAnalyser.create(metafile, {
					runtimeConfigPath: context.buildConfig.runtimeConfigPath,
					rootDir: context.buildConfig.rootDir,
					pages: context.buildConfig.pages,
				});

				const analysisResults = await Promise.all(
					Object.entries(metafile.outputs).map(([outputPath, output]) => {
						return analyser.analyse(outputPath, output);
					}),
				);

				/** @type {Omit<WritableManifest, 'assets'>} */
				const writableManifest = {
					pages: [],
					hash: "",
					runtimeConfig: "",
				};

				for (const analysis of analysisResults) {
					if (analysis === undefined) {
						continue;
					}

					if (analysis.type === "config") {
						const configHash = context.watch
							? `${analysis.moduleHash}-watch`
							: analysis.moduleHash;
						writableManifest.hash = configHash;
						writableManifest.runtimeConfig = analysis.output;
					}

					if (analysis.type === "page") {
						writableManifest.pages.push({
							moduleHash: analysis.moduleHash,
							entrypoint: analysis.entrypoint,
							outputPath: analysis.output,
						});
					}
				}

				context.updateManifest(writableManifest);
			});
		},
	};
}
