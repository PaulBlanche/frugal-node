import * as _type from "./_type/Config.js";
import * as fs from "./utils/fs.js";
import { GLOBAL_CONFIG, config as configLog, log } from "./utils/log.js";
import * as path from "./utils/path.js";

/** @typedef {_type.Config} Config */

export class FrugalConfig {
	/** @type {_type.Config} */
	#config;

	/** @param {_type.Config} config */
	constructor(config) {
		this.#config = config;

		configLog(config.log);
	}

	get _config() {
		return this.#config;
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
		return path.fromFileUrl(this.#config.self);
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
}

export class ConfigError extends Error {}
