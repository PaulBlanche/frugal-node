/** @import * as self from "./buildPlugin.js" */
/** @import { Page } from "../page/Page.js"; */

import * as path from "node:path";
import { RuntimeConfig } from "../RuntimeConfig.js";
import { PageAssets } from "../page/PageAssets.js";
import { Producer } from "../page/Producer.js";
import { parse } from "../page/parse.js";
import * as manifest from "./manifest.js";

/** @type {self.buildPlugin} */
export function buildPlugin(buildCache) {
	return {
		name: "frugal-internal-plugin:build",
		setup(build, context) {
			build.onEnd(async (result) => {
				try {
					const errors = result.errors;

					if (errors.length > 0) {
						return;
					}

					const runtimeConfig = (
						await import(
							path.resolve(
								context.buildConfig.rootDir,
								context.manifest.runtimeConfig,
							)
						)
					).default;
					const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

					const pages = await Promise.all(
						context.manifest.pages.map(async (manifestPage) => {
							const pagePath = path.resolve(
								context.buildConfig.rootDir,
								manifestPage.outputPath,
							);
							const descriptor = await import(pagePath);

							return {
								manifestPage,
								page: parse({
									descriptor,
									entrypoint: manifestPage.entrypoint,
									moduleHash: manifestPage.moduleHash,
								}),
							};
						}),
					);

					await context.buildConfig.exporter?.validate?.(
						pages.map((entry) => entry.page),
					);

					await Promise.all(
						pages.map(async ({ page, manifestPage }) => {
							if (page.type === "dynamic") {
								manifestPage.type = "dynamic";
								return;
							}

							const pageAssets = PageAssets.create(
								context.manifest.assets,
								page.entrypoint,
							);

							const pageProducer = Producer.create({
								assets: pageAssets,
								page,
								configHash: context.manifest.hash,
								runtimeConfig: internalRuntimeConfig,
							});

							const pathParams = await pageProducer.getPathParams();
							if (page.strictPaths) {
								manifestPage.params = pathParams;
							}
							manifestPage.type = "static";

							await Promise.all(
								pathParams.map(async (params) => {
									const response = await pageProducer.build({ params });
									if (response !== undefined) {
										return await buildCache.add(response);
									}
								}),
							);
						}),
					);

					await manifest.writeManifests(
						{
							rootDir: context.buildConfig.rootDir,
							outDir: context.buildConfig.outDir,
						},
						context.manifest,
					);

					await buildCache.save();
				} catch (e) {
					console.log(e);
					throw e;
				}
			});
		},
	};
}
