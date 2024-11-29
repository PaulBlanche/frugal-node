/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import { InternalRuntimeConfig } from "@frugal-node/core/config/runtime" */
/** @import { CacheStorage } from "@frugal-node/core/server" */
/** @import * as webStream from "node:stream/web" */

import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import { FrugalServer, ServerCache } from "@frugal-node/core/server";
import { loadDynamicManifest, loadStaticManifest } from "../../core/src/build/manifest.js";
import { BuildSnapshot } from "../../core/src/exporter/BuildSnapshot.js";
import { Hash } from "../../core/src/utils/Hash.js";
import { readStream } from "../../core/src/utils/readableStream.js";
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
				};
				return memory;
			},
			Promise.resolve(
				/** @type {Record<string, import("../../core/src/page/FrugalResponse.js").SerializedFrugalResponse>} */ ({}),
			),
		);

		const decoder = new TextDecoder();
		const encoder = new TextEncoder();

		/** @type {CacheStorage} */
		const cacheStorage = {
			set: async (url, metadata, body) => {
				const path = new URL(url).pathname;
				memory[path] = {
					path,
					body:
						body === null
							? undefined
							: decoder.decode(
									await readStream(/** @type {webStream.ReadableStream}*/ (body)),
								),
					hash: Hash.create()
						.update(String(Date.now()))
						.update(String(Math.random()))
						.digest(),
					headers: metadata.headers,
					status: metadata.status,
				};
			},
			get: (url) => {
				const path = new URL(url).pathname;
				const entry = memory[path];
				if (entry === undefined) {
					return undefined;
				}

				const body = entry.body;

				return {
					metadata: {
						url,
						headers: entry.headers,
						status: entry.status,
						hash: entry.hash,
						statusText: "",
					},
					body:
						body === undefined
							? null
							: new ReadableStream({
									start(controller) {
										controller.enqueue(encoder.encode(body));
										controller.close();
									},
								}),
				};
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
