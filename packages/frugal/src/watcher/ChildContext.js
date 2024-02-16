import * as esbuild from "esbuild";
import * as config from "../Config.js";
import * as manifest from "../builder/Manifest.js";
import { buildPlugin } from "../builder/buildPlugin.js";
import * as bundler from "../bundler/bundler.js";
import { Server } from "../server/Server.js";
import * as cache from "./Cache.js";
import * as watchContext from "./_type/WatchContext.js";

export const WATCH_MESSAGE_SYMBOL = Symbol("WATCH_MESSAGE_SYMBOL");

export class ChildContext {
	/** @type {Promise<esbuild.BuildContext>} */
	#context;
	/** @type {AbortController} */
	#serverController;
	/** @type {number} */
	#port;

	/**
	 *
	 * @param {config.FrugalConfig} config
	 */
	constructor(config) {
		this.#serverController = new AbortController();
		this.#port = 3000;

		const watchCache = new cache.Cache();

		this.#context = bundler.context(config, [
			buildPlugin(watchCache),
			{
				name: "frugal-internal:watch",
				setup: (build, context) => {
					build.onStart(() => {
						console.log({
							type: "suspend",
							[WATCH_MESSAGE_SYMBOL]: true,
						});
					});

					build.onEnd(async (result) => {
						if (result.errors.length === 0) {
							context.reset();

							const server = new Server({
								config,
								manifest: await manifest.loadManifest(config),
								watch: true,
								cache: watchCache,
							});

							this.#serverController.abort();
							this.#serverController = new AbortController();

							// leave time for address to be freed
							setTimeout(() => {
								server.serve({
									port: this.#port,
									signal: this.#serverController.signal,
									onListen: () => {
										console.log({
											type: "reload",
											[WATCH_MESSAGE_SYMBOL]: true,
										});
									},
								});
							});
						}
					});
				},
			},
		]);
	}

	/**
	 * @param {watchContext.WatchOptions} [param0]
	 * @returns
	 */
	async watch({ port } = {}) {
		if (port !== undefined) {
			this.#port = port;
		}

		// patch log for watch message
		const originalLog = console.log;
		console.log = (...args) => {
			if (
				typeof args[0] === "object" &&
				args[0] !== null &&
				WATCH_MESSAGE_SYMBOL in args[0]
			) {
				originalLog(JSON.stringify(args[0]));
			} else {
				originalLog(...args);
			}
		};

		// cleanup when killing the child process
		process.on("SIGINT", async () => {
			await this.dispose();
			process.exit();
		});

		return await (await this.#context).watch();
	}

	async dispose() {
		if (this.#context !== undefined) {
			await (await this.#context).dispose();
		}
		this.#serverController.abort();
	}
}
