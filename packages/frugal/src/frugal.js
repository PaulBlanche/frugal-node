import { FrugalConfig } from "./Config.js";
import * as builder from "./builder/builder.js";
import { WatchContext } from "./watcher/WatchContext.js";

/** @type {import('./frugal.ts').build} */
export async function build(conf) {
	const frugalConfig = FrugalConfig.create(conf);
	await frugalConfig.validate();

	const buildConfig = await frugalConfig.build;

	await builder.build(buildConfig);

	if (buildConfig.exporter) {
		await buildConfig.exporter.export({ config: frugalConfig });
	}
}

/** @type {import('./frugal.ts').context} */
export async function context(conf) {
	const frugalConfig = FrugalConfig.create(conf);
	await frugalConfig.validate();

	const buildConfig = await frugalConfig.build;

	return WatchContext.create(buildConfig);
}
