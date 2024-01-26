import * as esbuild from "esbuild";
import * as manifest from "../../builder/Manifest.js";
import * as hash from "../../utils/hash.js";
import { MetafileAnalyser } from "../MetafileAnalyser.js";
import * as pluginContext from "../PluginContext.js";

/**
 * @param {pluginContext.PluginContext} context
 * @returns {esbuild.Plugin}
 */
export function buildManifest(context) {
	return {
		name: "frugal-internal:buildManifest",
		setup(build) {
			build.onEnd(async (result) => {
				try {
					const metafile = result.metafile;
					const errors = result.errors;

					if (errors.length !== 0 || metafile === undefined) {
						return;
					}

					const analyser = new MetafileAnalyser(metafile, context.config);
					const analysisResults = await Promise.all(
						Object.entries(metafile.outputs).map(([outputPath, output]) => {
							return analyser.analyse(outputPath, output);
						}),
					);

					/** @type {manifest.WritableManifest} */
					const writableManifest = {
						pages: [],
						id: "",
						config: "",
						assets: context.assets,
					};

					const idHasher = hash.create();

					for (const analysis of analysisResults) {
						if (analysis === undefined) {
							continue;
						}

						if (analysis.type === "config") {
							writableManifest.config = context.watch
								? `${analysis.moduleHash}-watch`
								: analysis.moduleHash;
							idHasher.update(writableManifest.config);
						}

						if (analysis.type === "css") {
							idHasher.update(analysis.moduleHash);
						}

						if (analysis.type === "page") {
							writableManifest.pages.push({
								moduleHash: analysis.moduleHash,
								entrypoint: analysis.entrypoint,
								outputPath: analysis.output,
							});
							idHasher.update(analysis.moduleHash);
						}
					}

					writableManifest.id = idHasher.digest();

					context.updateManifest(writableManifest);
				} catch (error) {
					console.log(error);
					throw error;
				}
			});
		},
	};
}
