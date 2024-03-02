import { Page } from "../page/Page.js";
import { Producer } from "../page/Producer.js";
import * as manifest from "./manifest.js";

/** @type {import('./buildPlugin.ts').buildPlugin} */
export function buildPlugin(buildCache) {
	return {
		name: "frugal-internal:build",
		setup(build, context) {
			build.onEnd(async () => {
				try {
					await manifest.writeManifest(context.config.global, context.manifest);

					const {
						pages,
						hash: configHash,
						assets,
					} = await manifest.loadManifest(context.config.global);

					await Promise.all(
						pages.map(async ({ descriptor, moduleHash, entrypoint }) => {
							const page = Page.create({
								entrypoint,
								moduleHash,
								pageDescriptor: descriptor,
							});

							if (page.type === "dynamic") {
								return;
							}

							const pageProducer = Producer.create(
								assets,
								page,
								configHash,
								context.config.global,
							);

							const responses = await pageProducer.buildAll();

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
