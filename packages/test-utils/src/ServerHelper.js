/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import { InternalServerConfig } from "../../core/exports/server/index.js" */

import { Server, ServerCache, ServerConfig } from "@frugal-node/core/server";
import { loadManifest } from "../../core/src/build/manifest.js";
import { BuildSnapshot } from "../../core/src/exporter/BuildSnapshot.js";
import { waitForPort } from "./waitForPort.js";

export class ServerHelper {
	/** @type {ServerConfig} */
	#serverConfig;
	/** @type {InternalServerConfig} */
	#internalServerConfig;
	/** @type {InternalBuildConfig} */
	#internalBuildConfig;

	/**
	 * @param {ServerConfig} serverConfig
	 * @param {InternalBuildConfig} internalBuildConfig
	 */
	constructor(serverConfig, internalBuildConfig) {
		this.#serverConfig = serverConfig;
		this.#internalBuildConfig = internalBuildConfig;
		this.#internalServerConfig = ServerConfig.create(serverConfig);
	}

	/** @param {Partial<ServerConfig> | ((config: ServerConfig) => Partial<ServerConfig>)} [config] */
	extends(config) {
		/** @type {ServerConfig} */
		const extendedServerConfig = {
			...this.#serverConfig,
			...(typeof config === "function" ? config(this.#serverConfig) : config),
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
				};
				return memory;
			},
			Promise.resolve(
				/** @type {Record<string, import("../../core/src/page/FrugalResponse.js").SerializedFrugalResponse>} */ ({}),
			),
		);

		/** @type {import("../../core/src/server/ServerCache.js").CacheStorage} */
		const cacheStorage = {
			get: (path) => {
				return memory[path];
			},
			set: (path, content) => {
				memory[path] = content;
			},
			delete: (path) => {
				delete memory[path];
			},
		};

		await waitForPort({ port: this.#internalServerConfig.port, hostname: "0.0.0.0" });
		const manifest = await loadManifest({
			rootDir: this.#internalBuildConfig.rootDir,
			outDir: this.#internalBuildConfig.outDir,
		});

		const server = await Server.create({
			config: this.#internalServerConfig,
			watch: false,
			manifest,
			cache: ServerCache.create(cacheStorage),
			publicDir: this.#internalBuildConfig.publicDir,
		});

		const controller = new AbortController();
		/** @type {PromiseWithResolvers<void>} */
		const servePromise = Promise.withResolvers();

		try {
			/** @type {PromiseWithResolvers<void>} */
			const listenDeferred = Promise.withResolvers();
			server
				.serve({
					signal: controller.signal,
					onListen: () => listenDeferred.resolve(),
				})
				.then(() => servePromise.resolve());
			await listenDeferred.promise;
			await callback();
		} finally {
			controller.abort();
			await servePromise.promise;
		}
	}
}
