import { MetafileAnalyser } from "../MetafileAnalyser.js";

/** @type {import('./buildManifest.ts').buildManifest} */
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

					const analyser = MetafileAnalyser.create(metafile, context.config);
					const analysisResults = await Promise.all(
						Object.entries(metafile.outputs).map(([outputPath, output]) => {
							return analyser.analyse(outputPath, output);
						}),
					);

					/** @type {Omit<import("../../builder/manifest.js").WritableManifest, 'assets'>} */
					const writableManifest = {
						pages: [],
						hash: "",
						config: "",
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
							writableManifest.config = analysis.output;
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
				} catch (error) {
					console.log(error);
					throw error;
				}
			});
		},
	};
}
