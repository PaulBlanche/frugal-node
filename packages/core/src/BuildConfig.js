/** @import * as self from "./BuildConfig.js" */

import * as path from "node:path";
import * as url from "node:url";
import { RuntimeConfig } from "./RuntimeConfig.js";
import * as fs from "./utils/fs.js";
import { config as configLog, log } from "./utils/log.js";

/** @type {self.BuildConfigCreator} */
export const BuildConfig = {
	create,
};

/** @type {self.BuildConfigCreator['create']} */
function create(config) {
	configLog(config.log);

	const self = url.fileURLToPath(config.self);
	const rootDir = path.dirname(self);
	const runtimeConfigPath = path.resolve(
		rootDir,
		config.runtimeConfigPath ?? "./frugal.config.js",
	);
	const outDir = path.resolve(rootDir, config?.outdir ?? "dist/");
	const publicDir = path.resolve(outDir, "public/");
	const cacheDir = path.resolve(outDir, ".cache/");
	const buildCacheDir = path.resolve(cacheDir, "build-cache/");
	const staticDir = path.resolve(rootDir, config?.staticDir ?? "static/");
	const tempDir = path.resolve(outDir, ".temp/");
	const buildDir = path.resolve(tempDir, "build/");

	const pages = config.pages.map((page) => path.resolve(rootDir, page));

	/**@type {self.InternalBuildConfig} */
	const frugalConfig = {
		get rootDir() {
			return rootDir;
		},

		get runtimeConfig() {
			return import(runtimeConfigPath).then(
				(module) => {
					const runtimeConfig = module.default;

					return RuntimeConfig.create(runtimeConfig);
				},
				() => {
					return undefined;
				},
			);
		},

		get runtimeConfigPath() {
			return runtimeConfigPath;
		},

		get outDir() {
			return outDir;
		},

		get publicDir() {
			return publicDir;
		},

		get cacheDir() {
			return cacheDir;
		},

		get buildCacheDir() {
			return buildCacheDir;
		},

		get staticDir() {
			return staticDir;
		},

		get buildDir() {
			return buildDir;
		},

		get tempDir() {
			return tempDir;
		},

		get pages() {
			return pages;
		},

		get plugins() {
			return config?.plugins ?? [];
		},

		get esbuildOptions() {
			return config?.esbuildOptions;
		},

		get exporter() {
			const exporter = config?.exporter;
			return typeof exporter === "boolean" ? undefined : exporter;
		},

		async validate() {
			if (config?.exporter === undefined) {
				log(
					"No exporter configured, build won't output a ready-to-deploy package. To ignore this warning set 'exporter: false' on your build config.",
					{
						scope: "Config",
						level: "warning",
					},
				);
			}

			try {
				await Promise.all(
					pages.map(async (page) => {
						try {
							return await fs.stat(page);
						} catch (error) {
							if (error instanceof fs.NotFound) {
								throw new BuildConfigError(
									`Page module "${path.relative(rootDir, page)}" not found`,
									{ cause: error },
								);
							}

							throw error;
						}
					}),
				);
			} catch (/** @type {any} */ error) {
				log(error, { scope: "Config" });
				throw error;
			}
		},
	};

	return frugalConfig;
}

export class BuildConfigError extends Error {}
