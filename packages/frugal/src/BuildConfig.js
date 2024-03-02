import { log } from "./utils/log.js";

/** @type {import('./BuildConfig.ts').FrugalBuildConfigMaker} */
export const FrugalBuildConfig = {
	create,
};

/** @type {import('./BuildConfig.ts').FrugalBuildConfigMaker['create']} */
function create(config) {
	if (config?.exporter === undefined) {
		log(
			"No exporter configured, build won't output a ready-to-deploy package. To ignore this warning set 'exporter: false' on your build config.",
			{
				scope: "Config",
				level: "warning",
			},
		);
	}

	return {
		get plugins() {
			return config?.plugins ?? [];
		},

		get cleanAllOutDir() {
			return config?.cleanAllOutDir ?? false;
		},

		get esbuildOptions() {
			return config?.esbuild;
		},

		get exporter() {
			const exporter = config?.exporter;
			return typeof exporter === "boolean" ? undefined : exporter;
		},
	};
}
