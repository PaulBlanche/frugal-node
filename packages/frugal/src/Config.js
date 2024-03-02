import * as path from "node:path";
import * as url from "node:url";
import { importKey } from "./utils/crypto.js";
import * as fs from "./utils/fs.js";
import { config as configLog, log } from "./utils/log.js";

/** @type {import('./Config.ts').FrugalConfigMaker} */
export const FrugalConfig = {
	create,
};

/** @type {import('./Config.ts').FrugalConfigMaker['create']} */
export function create(config) {
	const state = {
		/** @type {Promise<import('./Config.ts').FrugalServerConfig>|undefined} */
		serverConfig: undefined,
		/** @type {Promise<import('./Config.ts').FrugalBuildConfig>|undefined} */
		buildConfig: undefined,
	};

	configLog(config.log);

	// config should always have a self to `import.meta.url` so it should not be
	// undefined, but when bundling with esbuild to cjs (for vercel for
	// exemple), `import.meta` is an empty object so `import.meta.url` might be
	// undefined. We default to "/" in this case.
	const self = config.self ? url.fileURLToPath(config.self) : "/";
	const rootDir = path.dirname(self);
	const outDir = path.resolve(rootDir, config?.outdir ?? "dist/");
	const publicDir = path.resolve(outDir, "public/");
	const cacheDir = path.resolve(outDir, ".cache/");
	const buildCacheDir = path.resolve(cacheDir, "build-cache/");
	const staticDir = path.resolve(rootDir, config?.staticDir ?? "static/");
	const tempDir = path.resolve(outDir, ".temp/");
	const buildDir = path.resolve(tempDir, "build/");

	/**@type {import('./Config.ts').FrugalConfig} */
	const frugalConfig = {
		get self() {
			return self;
		},

		get rootDir() {
			return rootDir;
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

		get tempDir() {
			return tempDir;
		},

		get buildDir() {
			return buildDir;
		},

		get pages() {
			return config.pages.map((page) => path.resolve(rootDir, page));
		},

		get server() {
			if (state.serverConfig === undefined) {
				if (config.serverConfig) {
					state.serverConfig = import(url.fileURLToPath(config.serverConfig)).then(
						(module) => createFrugalServerConfig(module.default, frugalConfig),
					);
				} else {
					state.serverConfig = Promise.resolve(
						createFrugalServerConfig(undefined, frugalConfig),
					);
				}
			}

			return state.serverConfig;
		},

		get serverConfigUrl() {
			return config.serverConfig;
		},

		get build() {
			if (state.buildConfig === undefined) {
				if (config.buildConfig) {
					state.buildConfig = import(url.fileURLToPath(config.buildConfig)).then(
						(module) => createFrugalBuildConfig(module.default, frugalConfig),
					);
				} else {
					state.buildConfig = Promise.resolve(
						createFrugalBuildConfig(undefined, frugalConfig),
					);
				}
			}

			return state.buildConfig;
		},

		get buildConfigUrl() {
			return config.buildConfig;
		},

		resolve(specifier) {
			return path.resolve(rootDir, specifier);
		},

		async validate() {
			try {
				await Promise.all(
					config.pages
						.map((page) => path.resolve(rootDir, page))
						.map(async (page) => {
							try {
								return await fs.stat(page);
							} catch (error) {
								if (error instanceof fs.NotFound) {
									throw new ConfigError(
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

/**
 * @param {import("./Config.ts").BuildConfig|undefined} config
 * @param {import("./Config.ts").FrugalConfig} frugalConfig
 * @returns {import("./Config.ts").FrugalBuildConfig}
 */
function createFrugalBuildConfig(config, frugalConfig) {
	if (config?.exporter === undefined) {
		log(
			"No exporter configured, build won't output a ready-to-deploy package. To ignore this warning set 'exporter: false' on your build config.",
			{
				scope: "Config",
				level: "warning",
			},
		);
	}

	return {
		get global() {
			return frugalConfig;
		},

		get plugins() {
			return config?.plugins ?? [];
		},

		get cleanAllOutDir() {
			return config?.cleanAllOutDir ?? false;
		},

		get esbuildOptions() {
			return config?.esbuild;
		},

		get exporter() {
			const exporter = config?.exporter;
			return typeof exporter === "boolean" ? undefined : exporter;
		},
	};
}

/**
 * @param {import("./Config.ts").ServerConfig|undefined} config
 * @param {import("./Config.ts").FrugalConfig} frugalConfig
 * @returns {import("./Config.ts").FrugalServerConfig}
 */
function createFrugalServerConfig(config, frugalConfig) {
	const state = {
		/** @type {Promise<CryptoKey|undefined>|undefined} */
		cryptoKey: undefined,
	};
	return {
		get global() {
			return frugalConfig;
		},

		get secure() {
			return config?.secure ?? false;
		},

		get port() {
			return config?.port ?? 8000;
		},

		get cryptoKey() {
			if (state.cryptoKey === undefined) {
				state.cryptoKey = Promise.resolve(
					config?.cryptoKey ? importKey(config.cryptoKey) : undefined,
				);
			}
			return state.cryptoKey;
		},

		get session() {
			return config?.session;
		},

		get middlewares() {
			return config?.middlewares ?? [];
		},

		get csrf() {
			return config?.csrf;
		},
	};
}

export class ConfigError extends Error {}
