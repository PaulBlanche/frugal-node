/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import { InternalRuntimeConfig } from "@frugal-node/core/config/runtime" */
/** @import { CacheStorage } from "@frugal-node/core/server" */

import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { FrugalServer, ServerCache } from "@frugal-node/core/server";
import { loadDynamicManifest, loadStaticManifest } from "../../core/src/build/manifest.js";
import { BuildSnapshot } from "../../core/src/exporter/BuildSnapshot.js";
import { waitForPort } from "./waitForPort.js";

export class ServerHelper {
	/** @type {RuntimeConfig} */
	#runtimeConfig;
	/** @type {InternalRuntimeConfig} */
	#internalRuntimeConfig;
	/** @type {InternalBuildConfig} */
	#internalBuildConfig;

	/**
	 * @param {RuntimeConfig} runtimeConfig
	 * @param {InternalBuildConfig} internalBuildConfig
	 */
	constructor(runtimeConfig, internalBuildConfig) {
		this.#runtimeConfig = runtimeConfig;
		this.#internalBuildConfig = internalBuildConfig;
		this.#internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);
	}

	/** @param {Partial<RuntimeConfig> | ((config: RuntimeConfig) => Partial<RuntimeConfig>)} [config] */
	extends(config) {
		/** @type {RuntimeConfig} */
		const extendedServerConfig = {
			...this.#runtimeConfig,
			...(typeof config === "function" ? config(this.#runtimeConfig) : config),
		};
		return new ServerHelper(extendedServerConfig, this.#internalBuildConfig);
	}

	/**
	 * @param {() => Promise<void>|void} callback
	 */
	async withServer(callback) {
		const buildSnapshot = await BuildSnapshot.load({
			dir: this.#internalBuildConfig.buildCacheDir,
		});

		const memory = await buildSnapshot.current.reduce(
			async (memoryPromise, entry) => {
				const memory = await memoryPromise;

				memory[entry.path] = {
					path: entry.path,
					body: await buildSnapshot.getBody(entry),
					hash: entry.hash,
					headers: entry.headers,
					status: entry.status,
					maxAge: entry.maxAge,
					date: entry.date,
				};
				return memory;
			},
			Promise.resolve(
				/** @type {Record<string, import("../../core/src/page/FrugalResponse.js").SerializedFrugalResponse>} */ ({}),
			),
		);

		/** @type {CacheStorage} */
		const cacheStorage = {
			set: (path, response) => {
				memory[path] = response;
			},
			get: (path) => {
				return memory[path];
			},
		};

		await waitForPort({ port: this.#internalRuntimeConfig.port, hostname: "0.0.0.0" });
		const manifest = {
			static: await loadStaticManifest({
				rootDir: this.#internalBuildConfig.rootDir,
				outDir: this.#internalBuildConfig.outDir,
			}),
			dynamic: await loadDynamicManifest({
				rootDir: this.#internalBuildConfig.rootDir,
				outDir: this.#internalBuildConfig.outDir,
			}),
		};

		const server = FrugalServer.create({
			config: this.#internalRuntimeConfig,
			watch: false,
			manifest,
			cacheOverride: ServerCache.create(cacheStorage),
			publicDir: this.#internalBuildConfig.publicDir,
		});

		const controller = new AbortController();

		const { listening, finished } = server.serve({
			signal: controller.signal,
			port: this.#internalRuntimeConfig.port,
		});

		try {
			await listening;
			await callback();
		} finally {
			controller.abort();
			await finished;
		}
	}
}
