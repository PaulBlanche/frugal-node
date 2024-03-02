import { FrugalBuildConfig } from "./BuildConfig.js";
import { FrugalConfig } from "./Config.js";
import * as builder from "./builder/builder.js";
import { WatchContext } from "./watcher/WatchContext.js";

/** @type {import('./frugal.ts').build} */
export async function build(config, buildConfig) {
	const frugalConfig = FrugalConfig.create(config);
	await frugalConfig.validate();

	const frugalBuildConfig = FrugalBuildConfig.create(buildConfig);

	await builder.build(frugalConfig, frugalBuildConfig);

	if (frugalBuildConfig.exporter) {
		await frugalBuildConfig.exporter.export({ config: frugalConfig });
	}
}

/** @type {import('./frugal.ts').context} */
export async function context(config, buildConfig) {
	const frugalConfig = FrugalConfig.create(config);
	await frugalConfig.validate();

	const frugalBuildConfig = FrugalBuildConfig.create(buildConfig);

	return WatchContext.create(frugalConfig, frugalBuildConfig);
}
