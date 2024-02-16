import * as plugin from "../bundler/Plugin.js";
import { LiveGenerationResponse } from "../page/GenerationResponse.js";
import { compile } from "../page/Page.js";
import { Producer } from "../page/Producer.js";
import * as manifest from "./Manifest.js";

/** @typedef {{ add: (response:LiveGenerationResponse) => Promise<void>, save: () => Promise<void> }} BuildCache */

/**
 * @param {BuildCache} buildCache
 * @returns {plugin.Plugin}
 */
export function buildPlugin(buildCache) {
	return {
		name: "frugal-internal:build",
		setup(build, context) {
			build.onEnd(async () => {
				try {
					await manifest.writeManifest(context.config, context.manifest);

					const {
						pages,
						config: configHash,
						assets,
					} = await manifest.loadManifest(context.config);

					await Promise.all(
						pages.map(async ({ descriptor, moduleHash, entrypoint }) => {
							const page = compile({
								entrypoint,
								moduleHash,
								pageDescriptor: descriptor,
							});

							if (page.type === "dynamic") {
								return;
							}

							const producer = new Producer(assets, page, configHash, context.config);

							const responses = await producer.buildAll();

							await Promise.all(
								responses.map(async (response) => {
									return await buildCache.add(response);
								}),
							);
						}),
					);

					await buildCache.save();
				} catch (error) {
					console.log(error);
					throw error;
				}
			});
		},
	};
}
