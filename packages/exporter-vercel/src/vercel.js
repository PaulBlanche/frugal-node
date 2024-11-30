/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import { BuildSnapshot } from "@frugal-node/core/exporter" */

import * as path from "node:path";
import {
	getDynamicManifestPath,
	getStaticManifestPath,
	loadStaticManifest,
} from "@frugal-node/core/exporter";
import * as fs from "@frugal-node/core/utils/fs";
import * as esbuild from "esbuild";

/** @type {import("./vercel.ts").vercel} */
export function vercel({ outdir = undefined } = {}) {
	return {
		name: "vercel",
		async export(context) {
			const vercelDir = path.resolve(outdir ?? context.config.rootDir, ".vercel");
			const outputDir = path.resolve(vercelDir, "output");

			const indexFuncDir = await createServerlessFunction(outputDir, "index");
			const staticFuncDir = await createServerlessFunction(outputDir, "_static");
			const dynamicFuncDir = await createServerlessFunction(outputDir, "_dynamic");

			await output(
				path.resolve(outputDir, "config.json"),
				JSON.stringify(
					{
						version: 3,
						routes: [
							{ handle: "filesystem" },
							{ src: "^_static$", dest: "/_static/" },
							{ src: "^_dynamic$", dest: "/_dynamic/" },
							{ src: "^(?:/(.*))$", dest: "/" },
						],
					},
					null,
					2,
				),
			);

			await bundleFunctions(
				{ index: indexFuncDir, static: staticFuncDir, dynamic: dynamicFuncDir },
				outputDir,
				context.config,
			);
		},
	};
}

/**
 * @param {string} outputDir
 * @param {string} funcPath
 */
async function createServerlessFunction(outputDir, funcPath) {
	const functionDir = path.resolve(outputDir, `functions/${funcPath}.func`);

	await output(
		path.resolve(functionDir, ".vc-config.json"),
		JSON.stringify(
			{
				handler: "index.mjs",
				runtime: "nodejs20.x",
				launcherType: "Nodejs",
			},
			null,
			2,
		),
	);

	await output(path.resolve(functionDir, "package.json"), JSON.stringify({ type: "module" }));

	return functionDir;
}

/**
 *
 * @param {string} path
 * @param {string} content
 */
async function output(path, content) {
	await fs.ensureFile(path);
	await fs.writeTextFile(path, content);
}

/**
 * @param {{ index:string, static:string, dynamic:string}} functionsDir
 * @param {string} outputDir
 * @param {InternalBuildConfig} config
 */
async function bundleFunctions(functionsDir, outputDir, config) {
	const staticManifestPath = await getStaticManifestPath(config);
	const staticManifest = await loadStaticManifest(config);
	const dynamicManifestPath = await getDynamicManifestPath(config);
	const runtimeConfigPath = path.resolve(config.outDir, staticManifest.runtimeConfig);

	const result = await esbuild.build({
		entryPoints: [
			{ in: "vercel://index.js", out: path.resolve(functionsDir.index, "index.mjs") },
			{ in: "vercel://static.js", out: path.resolve(functionsDir.static, "index.mjs") },
			{ in: "vercel://dynamic.js", out: path.resolve(functionsDir.dynamic, "index.mjs") },
		],
		bundle: true,
		metafile: true,
		minify: true,
		define: {
			"process.env.NODE_ENV": '"production"',
		},
		plugins: [
			virtual({
				"vercel://static.js": `
					import * as staticManifest from "${staticManifestPath}";
					import { InternalServer } from '@frugal-node/core/server';
					import runtimeConfig from "${runtimeConfigPath}";

					const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

					const handler = InternalServer.create({
						manifest: { static: staticManifest },
						config: internalRuntimeConfig,
						watch: false
					})

					export default handler
				`,
				"vercel://dynamic.js": `
					import * as dynamicManifest from "${dynamicManifestPath}";
					import { InternalServer } from '@frugal-node/core/server';
					import runtimeConfig from "${runtimeConfigPath}";

					const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

					const handler = InternalServer.create({
						manifest: { dynamic: dynamicManifest },
						config: internalRuntimeConfig,
						watch: false
					})

					export default handler
				`,
				"vercel://index.js": `
					import * as dynamicManifest from "${dynamicManifestPath}";
					import * as staticManifest from "${dynamicManifestPath}";
					import { ProxyServer } from '@frugal-node/core/server';
					import * as crypto from '@frugal-node/core/utils/crypto';
					import runtimeConfig from "${path.resolve(config.outDir, staticManifest.runtimeConfig)}";

					const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

					const handler = ProxyServer.create({
						manifest: { static: staticManifest, dynamic: dynamicManifest },
						publicDir: undefined,
						watch: fale,
						internal: async (context, action) => {
							if (action.type === "static") {
								const frugalToken = await crypto.token(await internalRuntimeConfig.cryptoKey, {
									type: action.type,
									op: action.op,
									index: String(action.index),
									url: context.request.url,
									params: JSON.stringify(action.params),
								});

								const url = new URL(context.request.url);
								url.pathname = "/_static";
								url.searchParams.set("token", frugalToken);
								const request = new Request(url.toString(), context.request);

								return fetch(request)
							} else {
								const frugalToken = await crypto.token(await internalRuntimeConfig.cryptoKey, {
									type: action.type,
									index: String(action.index),
									url: context.request.url,
									params: JSON.stringify(action.params),
								});

								const url = new URL(context.request.url);
								url.pathname = "/_dynamic";
								url.searchParams.set("token", frugalToken);
								const request = new Request(url.toString(), context.request);

								return fetch(request)
							}
						},
						config: internalRuntimeConfig,
					})

					export default handler
				`,
			}),
			copy([
				{
					from: path.resolve(config.buildDir, "assets"),
					to: path.resolve(functionsDir.dynamic, "assets"),
					recursive: true,
					forgiveNotFound: true,
				},
				{
					from: path.resolve(config.buildDir, "assets"),
					to: path.resolve(functionsDir.static, "assets"),
					recursive: true,
					forgiveNotFound: true,
				},
				{
					from: path.resolve(config.buildDir, "assets"),
					to: path.resolve(functionsDir.index, "assets"),
					recursive: true,
					forgiveNotFound: true,
				},
				{
					from: config.publicDir,
					to: path.resolve(outputDir, "static"),
					recursive: true,
					forgiveNotFound: true,
				},
			]),
		],
		sourcemap: false,
		loader: { ".node": "file" },
		platform: "node",
		format: "esm",
		logOverride: {
			"empty-import-meta": "silent",
		},
		absWorkingDir: config.rootDir,
		outdir: outputDir,
	});

	await fs.writeTextFile(path.resolve(outputDir, "meta.json"), JSON.stringify(result.metafile));
}

const MATCH_ALL_REGEXP = /.*/;

/**
 * @param {Record<string,string>} config
 * @returns {esbuild.Plugin}
 */
function virtual(config) {
	return {
		name: "frugal-internal-plugin:virtual",
		setup(build) {
			for (const specifier of Object.keys(config)) {
				build.onResolve({ filter: new RegExp(escapeRegExp(specifier)) }, (args) => {
					return {
						path: args.path,
						namespace: "virtual",
					};
				});
			}

			build.onLoad({ filter: MATCH_ALL_REGEXP, namespace: "virtual" }, (args) => {
				const contents = config[args.path];
				return { contents, resolveDir: "." };
			});
		},
	};
}

/**
 * @param {string} string
 * @returns {string}
 */
function escapeRegExp(string) {
	return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * @param {{ from: string; to: string; recursive?: boolean; forgiveNotFound?: boolean; }[]} config
 * @returns {esbuild.Plugin}
 */
function copy(config) {
	return {
		name: "frugal-internal-plugin:copy",
		setup(build) {
			build.onEnd(async () => {
				const promises = [];

				for (const entry of config) {
					const copyPromise = (async () => {
						try {
							await fs.copy(entry.from, entry.to, {
								overwrite: true,
								recursive: entry.recursive,
							});
						} catch (/** @type {any} */ error) {
							if (!(entry.forgiveNotFound && error instanceof fs.NotFound)) {
								throw error;
							}
						}
					})();

					promises.push(copyPromise);
				}

				await Promise.all(promises);
			});
		},
	};
}
