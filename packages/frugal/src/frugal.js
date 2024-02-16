import * as config from "./Config.js";
import * as builder from "./builder/builder.js";
import * as watcher from "./watcher/watcher.js";

/**
 * @param {config.Config} conf
 * @returns {Promise<void>}
 */
export async function build(conf) {
	const frugalConfig = await _getConfig(conf);

	await builder.build(frugalConfig);

	if (frugalConfig.exporter) {
		await frugalConfig.exporter.export({ config: frugalConfig });
	}
}

/**
 * @param {config.Config} conf
 * @returns {Promise<watcher.WatchContext>}
 */
export async function context(conf) {
	const frugalConfig = await _getConfig(conf);

	return watcher.context(frugalConfig);
}

/**
 *
 * @param {config.Config} conf
 * @returns {Promise<config.FrugalConfig>}
 */
async function _getConfig(conf) {
	const frugalConfig = new config.FrugalConfig(conf);
	await frugalConfig.validate();

	return frugalConfig;
}
