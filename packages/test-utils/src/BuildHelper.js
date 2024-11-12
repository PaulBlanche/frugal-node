/** @import { InternalBuildConfig } from "../../core/exports/config/build.js" */
/** @import { InternalRuntimeConfig } from "../../core/exports/config/runtime.js" */

import { PageAssets } from "@frugal-node/core/page";
import * as fs from "@frugal-node/core/utils/fs";
import { BuildConfig } from "../../core/exports/config/build.js";
import { RuntimeConfig } from "../../core/exports/config/runtime.js";
import { build } from "../../core/exports/index.js";
import { loadManifest } from "../../core/src/build/manifest.js";
import { BuildCacheExplorer } from "./BuildCacheExplorer.js";
import * as fixtures from "./fixtures.js";

export class BuildHelper {
	/** @type {InternalBuildConfig} */
	#internalBuildConfig;
	/** @type {InternalRuntimeConfig} */
	#internalRuntimeConfig;
	/** @type {BuildConfig} */
	#buildConfig;
	/** @type {RuntimeConfig} */
	#runtimeConfig;

	/**
	 * @param {string} dirname
	 */
	static async setupFixtures(dirname) {
		const buildConfig = await fixtures.setup(dirname);
		const internalBuildConfig = BuildConfig.create(buildConfig);
		const runtimeConfig = (await import(internalBuildConfig.runtimeConfigPath)).default;
		const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);
		return new BuildHelper(
			buildConfig,
			runtimeConfig,
			internalBuildConfig,
			internalRuntimeConfig,
		);
	}

	/**
	 * @param {BuildConfig} buildConfig
	 * @param {BuildConfig} runtimeConfig
	 * @param {InternalBuildConfig} internalBuildConfig
	 * @param {InternalRuntimeConfig} internalRuntimeConfig
	 */
	constructor(buildConfig, runtimeConfig, internalBuildConfig, internalRuntimeConfig) {
		this.#buildConfig = buildConfig;
		this.#runtimeConfig = runtimeConfig;
		this.#internalBuildConfig = internalBuildConfig;
		this.#internalRuntimeConfig = internalRuntimeConfig;
	}

	get buildConfig() {
		return this.#buildConfig;
	}

	get runtimeConfig() {
		return this.#runtimeConfig;
	}

	get internalBuildConfig() {
		return this.#internalBuildConfig;
	}

	get internalRuntimeConfig() {
		return this.#internalRuntimeConfig;
	}

	get manifest() {
		return loadManifest(this.#internalBuildConfig);
	}

	getCacheExplorer() {
		return BuildCacheExplorer.load(this.#internalBuildConfig);
	}

	/**
	 * @param {string} entrypoint
	 * @returns {Promise<PageAssets>}
	 */
	async getAssets(entrypoint) {
		return PageAssets.create((await this.manifest).assets, entrypoint);
	}

	/** @param {Partial<BuildConfig> | ((config: BuildConfig) => Partial<BuildConfig>)} [config] */
	async extends(config) {
		/** @type {BuildConfig} */
		const extendedBuildConfig = {
			...this.#buildConfig,
			...(typeof config === "function" ? config(this.#buildConfig) : config),
		};
		const internalBuildConfig = BuildConfig.create(extendedBuildConfig);
		const runtimeConfig = (await import(internalBuildConfig.runtimeConfigPath)).default;
		const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);
		return new BuildHelper(
			extendedBuildConfig,
			runtimeConfig,
			internalBuildConfig,
			internalRuntimeConfig,
		);
	}

	build() {
		return build(this.#buildConfig);
	}

	async clean() {
		await fs.remove(this.internalBuildConfig.outDir, { recursive: true });
	}
}
