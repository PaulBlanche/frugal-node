/** @import * as self from "./ChildContext.js" */

import * as path from "node:path";
import { RuntimeConfig } from "../RuntimeConfig.js";
import { buildPlugin } from "../build/buildPlugin.js";
import * as manifest from "../build/manifest.js";
import * as bundler from "../esbuild/esbuild.js";
import { FrugalServer } from "../server/FrugalServer.js";
import { WATCH_MESSAGE_SYMBOL } from "./watchPlugin.js";
import { watchPlugin } from "./watchPlugin.js";

/** @type {self.ChildContextCreator} */
export const ChildContext = {
	create,
};

/** @type {self.ChildContextCreator['create']} */
function create(buildConfig, watchCache) {
	const state = {
		serverController: new AbortController(),
		port: 3000,
	};

	const contextPromise = bundler.context(buildConfig, [
		buildPlugin(watchCache.build),
		watchPlugin({
			startServer: async (config) => {
				await _startServer(config);
			},
		}),
	]);

	return {
		watch,
		dispose,
	};

	/** @type {self.ChildContext['dispose']} */
	async function dispose() {
		if (contextPromise !== undefined) {
			await (await contextPromise).dispose();
		}
		state.serverController.abort();
	}

	/** @type {self.ChildContext['watch']} */
	async function watch({ port = 3000 } = {}) {
		state.port = port;

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
			await dispose();
			process.exit();
		});

		return await (await contextPromise).watch();
	}

	/**
	 * @param {{  onListen: () => void}} config
	 */
	async function _startServer({ onListen }) {
		const dynamicManifest = await manifest.loadDynamicManifest({
			rootDir: buildConfig.rootDir,
			outDir: buildConfig.outDir,
		});
		const staticManifest = await manifest.loadStaticManifest({
			rootDir: buildConfig.rootDir,
			outDir: buildConfig.outDir,
		});

		const runtimeConfig = (
			await import(path.resolve(buildConfig.outDir, staticManifest.runtimeConfig))
		).default;
		const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

		const instance = FrugalServer.create({
			config: internalRuntimeConfig,
			publicDir: buildConfig.publicDir,
			manifest: { static: staticManifest, dynamic: dynamicManifest },
			watch: true,
			cacheOverride: watchCache.server,
		});

		state.serverController.abort();
		state.serverController = new AbortController();

		const { listening } = instance.serve({
			port: state.port,
			signal: state.serverController.signal,
		});

		await listening;
		onListen();
	}
}
