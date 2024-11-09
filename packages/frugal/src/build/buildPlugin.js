/** @import * as self from "./buildPlugin.js" */

import { Producer } from "../page/Producer.js";
import { parse } from "../page/parse.js";
import * as manifest from "./manifest.js";

/** @type {self.buildPlugin} */
export function buildPlugin(buildCache) {
	return {
		name: "frugal-internal-plugin:build",
		setup(build, context) {
			build.onEnd(async (result) => {
				const errors = result.errors;

				if (errors.length !== 0) {
					return;
				}

				const manifestConfig = {
					rootDir: context.buildConfig.rootDir,
					outDir: context.buildConfig.outDir,
				};

				await manifest.writeManifest(manifestConfig, context.manifest);

				const {
					pages,
					hash: configHash,
					assets,
				} = await manifest.loadManifest(manifestConfig);

				await Promise.all(
					pages.map(async ({ descriptor, moduleHash, entrypoint }) => {
						const page = parse({ descriptor, entrypoint, moduleHash });

						if (page.type === "dynamic") {
							return;
						}

						const pageProducer = Producer.create(assets, page, configHash);

						const responses = await pageProducer.buildAll();

						await Promise.all(
							responses.map(async (response) => {
								return await buildCache.add(response);
							}),
						);
					}),
				);

				await buildCache.save();
			});
		},
	};
}
