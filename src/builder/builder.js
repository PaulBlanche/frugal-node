import * as config from "../Config.js";
import * as plugin from "../bundler/Plugin.js";
import * as bundler from "../bundler/bundler.js";
import { PageAssets } from "../page/Assets.js";
import { compile } from "../page/Page.js";
import { log } from "../utils/log.js";
import * as cache from "./Cache.js";
import * as manifest from "./Manifest.js";
import * as pageBuilder from "./pageBuilder.js";

/**
 * @param {config.FrugalConfig} frugalConfig
 * @returns {Promise<void>}
 */
export async function build(frugalConfig) {
	log("Start building", { scope: "Builder", level: "debug" });

	await bundler.build(frugalConfig, [onBuildEnd]);

	log("Build done", { scope: "Builder", level: "debug" });
}

/** @type {plugin.Plugin} */
const onBuildEnd = {
	name: "frugal-internal:onBuildEnd",
	setup(build, context) {
		build.onEnd(async () => {
			try {
				await manifest.writeManifest(context.config, context.manifest);

				const {
					pages,
					config: configHash,
					assets,
				} = await manifest.loadManifest(context.config);

				const buildCache = await cache.load({
					dir: context.config.buildCacheDir,
				});

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

						const cacheableResponses = await pageBuilder.build(page, {
							resolve: (path) => context.config.resolve(path),
							configHash: configHash,
							assets: new PageAssets(assets, entrypoint),
						});

						await Promise.all(
							cacheableResponses.map((cacheableResponse) => {
								return buildCache.add(cacheableResponse);
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
