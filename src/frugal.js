import * as config from "./Config.js";
import * as builder from "./builder/builder.js";

/**
 * @param {config.Config} conf
 * @returns {Promise<void>}
 */
export async function build(conf) {
	const frugalConfig = new config.FrugalConfig(conf);
	await frugalConfig.validate();
	await builder.build(frugalConfig);

	if (frugalConfig.exporter) {
		await frugalConfig.exporter.export({ config: frugalConfig });
	}
}
