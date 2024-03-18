import { buildPlugin } from "../builder/buildPlugin.js";
import * as manifest from "../builder/manifest.js";
import * as bundler from "../bundler/bundler.js";
import { Server } from "../server/Server.js";

const WATCH_MESSAGE_SYMBOL = Symbol("WATCH_MESSAGE_SYMBOL");

/** @type {import('./ChildContext.ts').ChildContextMaker} */
export const ChildContext = {
	create,
};

/** @type {import('./ChildContext.ts').ChildContextMaker['create']} */
export function create(config, buildConfig, watchCache) {
	//const watchCache = WatchCache.create();

	const state = {
		serverController: new AbortController(),
		port: 3000,
	};

	/** @type {import('../bundler/Plugin.ts').PrivatePlugin} */
	const watchPlugin = {
		name: "frugal-internal:watch",
		setup: (build, context) => {
			build.onStart(() => {
				console.log({
					type: "build:start",
					[WATCH_MESSAGE_SYMBOL]: true,
				});
			});

			build.onEnd(async (result) => {
				if (result.errors.length === 0) {
					context.reset();

					const instance = await Server.create({
						config: config,
						manifest: await manifest.loadManifest(config),
						watch: true,
						cache: watchCache,
					});

					state.serverController.abort();
					state.serverController = new AbortController();

					// leave time for address to be freed
					setTimeout(() => {
						instance.serve({
							port: state.port,
							signal: state.serverController.signal,
							onListen: () => {
								console.log({
									type: "build:end",
									[WATCH_MESSAGE_SYMBOL]: true,
								});
							},
						});
					});
				}
			});
		},
	};

	const context = bundler.context(config, buildConfig, [buildPlugin(watchCache), watchPlugin]);

	return {
		async watch({ port } = {}) {
			if (port !== undefined) {
				state.port = port;
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

			return await (await context).watch();
		},

		async dispose() {
			if (context !== undefined) {
				await (await context).dispose();
			}
			state.serverController.abort();
		},
	};
}
