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
	configLog(config.log);

	const self = url.fileURLToPath(config.self);
	const rootDir = path.dirname(self);
	const outDir = path.resolve(rootDir, config?.outdir ?? "dist/");
	const publicDir = path.resolve(outDir, "public/");
	const cacheDir = path.resolve(outDir, ".cache/");
	const buildCacheDir = path.resolve(cacheDir, "build-cache/");
	const staticDir = path.resolve(rootDir, config?.staticDir ?? "static/");
	const tempDir = path.resolve(outDir, ".temp/");
	const buildDir = path.resolve(tempDir, "build/");

	const pages = config.pages.map((page) => path.resolve(rootDir, page));

	const serverConfig = createFrugalServerConfig(config.server);

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
			return pages;
		},

		get server() {
			return serverConfig;
		},

		async validate() {
			try {
				await Promise.all(
					pages.map(async (page) => {
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
 * @param {import("./Config.ts").ServerConfig|undefined} config
 * @returns {import("./Config.ts").FrugalServerConfig}
 */
function createFrugalServerConfig(config) {
	const state = {
		/** @type {Promise<CryptoKey|undefined>|undefined} */
		cryptoKey: undefined,
	};
	return {
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
