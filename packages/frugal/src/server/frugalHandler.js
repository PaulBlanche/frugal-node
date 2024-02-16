import { FrugalConfig } from "../Config.js";
import * as manifest from "../builder/Manifest.js";
import * as page from "../page/Page.js";
import * as handler from "./handler.js";
import * as middleware from "./middleware.js";

/**
 * @param {FrugalConfig} config
 * @returns {Promise<handler.Handler>}
 */
async function furgalHandler(config) {
	const loadedManifest = await manifest.loadManifest(config);
	const pages = loadedManifest.pages.map(({ moduleHash, entrypoint, descriptor }) =>
		page.compile({ entrypoint, moduleHash, pageDescriptor: descriptor }),
	);

	return (request) => {
		return new Response();
	};
}
