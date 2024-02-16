import * as path from "node:path";
import * as url from "node:url";
import * as _type from "./_type/Config.js";
import * as fs from "./utils/fs.js";
import { config as configLog, log } from "./utils/log.js";

/** @typedef {_type.Config} Config */

export class FrugalConfig {
	/** @type {_type.Config} */
	#config;
	/** @type {FrugalServerConfig} */
	#serverConfig;

	/** @param {_type.Config} config */
	constructor(config) {
		this.#config = config;

		configLog(config.log);

		this.#serverConfig = new FrugalServerConfig(config.server ?? {});
	}

	/**
	 * @type {_type.Config}
	 */
	get runtime() {
		return {
			...this.#config,
			plugins: [],
			exporter: undefined,
		};
	}

	async validate() {
		try {
			await Promise.all(
				this.pages.map(async (page) => {
					try {
						return await fs.stat(page);
					} catch (error) {
						if (error instanceof fs.NotFound) {
							throw new ConfigError(
								`Page module "${path.relative(this.rootDir, page)}" not found`,
								{ cause: error },
							);
						}

						throw error;
					}
				}),
			);
			if (this.#config.exporter === undefined)
				[
					log(
						"No exporter configured, build won't output a ready-to-deploy package. To ignore this warning set 'exporter: false' on your config.",
						{
							scope: "Config",
							level: "warning",
						},
					),
				];
		} catch (/** @type {any} */ error) {
			log(error, { scope: "Config" });
			throw error;
		}
	}

	get plugins() {
		return this.#config.plugins ?? [];
	}

	get self() {
		return url.fileURLToPath(this.#config.self);
	}

	get rootDir() {
		return path.dirname(this.self);
	}

	get cleanAllOutDir() {
		return this.#config.cleanAllOutDir ?? false;
	}

	get pages() {
		return this.#config.pages.map((page) => path.resolve(this.rootDir, page));
	}

	get outDir() {
		return path.resolve(this.rootDir, this.#config.outdir ?? "dist/");
	}

	get publicDir() {
		return path.resolve(this.outDir, "public/");
	}

	get staticDir() {
		return path.resolve(this.rootDir, this.#config.staticDir ?? "static/");
	}

	get tempDir() {
		return path.resolve(this.outDir, ".temp/");
	}

	get buildDir() {
		return path.resolve(this.tempDir, "build/");
	}

	get cacheDir() {
		return path.resolve(this.outDir, ".cache/");
	}

	get buildCacheDir() {
		return path.resolve(this.cacheDir, "build-cache/");
	}

	get esbuildOptions() {
		return this.#config.esbuild;
	}

	get exporter() {
		return typeof this.#config.exporter === "boolean" ? undefined : this.#config.exporter;
	}

	/**
	 * @param {string} specifier
	 * @returns {string}
	 */
	resolve(specifier) {
		return path.resolve(this.rootDir, specifier);
	}

	get server() {
		return this.#serverConfig;
	}
}

export class FrugalServerConfig {
	/** @type {_type.ServerConfig} */
	#config;

	/**
	 * @param {_type.ServerConfig} config
	 */
	constructor(config) {
		this.#config = config;
	}

	get secure() {
		return this.#config.secure ?? false;
	}

	get port() {
		return this.#config.port ?? 8000;
	}

	get cryptoKey() {
		return this.#config.cryptoKey;
	}

	get session() {
		return this.#config.session;
	}

	get middlewares() {
		return this.#config.middlewares ?? [];
	}

	get csrf() {
		return this.#config.csrf;
	}
}

export class ConfigError extends Error {}
