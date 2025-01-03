/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import { StaticManifest } from "@frugal-node/core/exporter" */

import * as path from "node:path";
import { BuildConfigError } from "@frugal-node/core/config/build";
import { RuntimeConfig } from "@frugal-node/core/config/runtime";
import {
	getDynamicManifestPath,
	getStaticManifestPath,
	loadStaticManifest,
} from "@frugal-node/core/exporter";
import { parse } from "@frugal-node/core/page";
import { token } from "@frugal-node/core/utils/crypto";
import * as fs from "@frugal-node/core/utils/fs";
import * as esbuild from "esbuild";

/** @type {import("./vercel.ts").vercel} */
export function vercel({ outdir = undefined } = {}) {
	return {
		name: "vercel",
		validate(pages) {
			for (const page of pages) {
				if (page.type === "static" && page.hasGenerate) {
					throw new BuildConfigError(
						'Vercel exporter does not support static pages with "generate" methods',
					);
				}
			}
		},
		async export(context) {
			const vercelDir = path.resolve(outdir ?? context.config.rootDir, ".vercel");
			const outputDir = path.resolve(vercelDir, "output");

			const staticManifest = await loadStaticManifest(context.config);

			await createRootConfig(outputDir, staticManifest);

			const handlerFuncDir = await createServerlessFunction(outputDir, "__handler");

			const runtimeConfigPath = path.resolve(
				context.config.outDir,
				staticManifest.runtimeConfig,
			);

			/** @type {RuntimeConfig} */
			const runtimeConfig = (await import(runtimeConfigPath)).default;
			const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

			const bypassToken = await token(await internalRuntimeConfig.cryptoKey, { t: "bypass" });

			await bundleFunctions(
				{ handler: handlerFuncDir },
				bypassToken,
				outputDir,
				runtimeConfigPath,
				context.config,
			);

			await Promise.all(
				context.snapshot.current.map(async (entry) => {
					const body = await context.snapshot.getBody(entry);

					if (body === undefined) {
						return;
					}

					const absolutePath = path.join(entry.path, "index");
					const fallbackPath = path.resolve(
						path.dirname(handlerFuncDir),
						`.${absolutePath}.prerender-fallback.html`,
					);
					const configPath = path.resolve(
						path.dirname(handlerFuncDir),
						`.${absolutePath}.prerender-config.json`,
					);

					await output(fallbackPath, body);

					await output(
						configPath,
						JSON.stringify({
							expiration: entry.maxAge < 0 ? false : entry.maxAge,
							bypassToken,
							fallback: path.basename(fallbackPath),
						}),
					);

					try {
						const absoluteLinkPath = path.resolve(
							path.dirname(handlerFuncDir),
							`.${absolutePath}.func`,
						);
						const absoluteTarget = handlerFuncDir;
						const relativeTarget = path.relative(
							path.dirname(absoluteLinkPath),
							absoluteTarget,
						);
						if (relativeTarget === "") {
							return;
						}
						await fs.symlink(relativeTarget, absoluteLinkPath);
					} catch (error) {
						if (!(error instanceof fs.AlreadyExists)) {
							throw error;
						}
					}
				}),
			);
		},
	};
}

/**
 * @param {string} outputDir
 * @param {StaticManifest} staticManifest
 */
async function createRootConfig(outputDir, staticManifest) {
	await output(
		path.resolve(outputDir, "config.json"),
		JSON.stringify(
			{
				version: 3,
				routes: [
					{ handle: "filesystem" }, // static files
					...staticManifest.pages.map((entry) => ({
						methods: ["GET"],
						src: parse(entry).regexpRoute.toString(),
						dest: "/__handler",
					})), // handle static page as prerender functions
					{
						src: "^(?:/(.*))$",
						dest: "/__handler",
					}, // handle everything else as normal function (dynamic)
				],
				framework: {
					slug: "frugal",
					version: "1.0.0",
				},
			},
			null,
			2,
		),
	);
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
				framework: {
					slug: "frugale",
					version: "1.0.0",
				},
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
 * @param {{ handler:string, }} functionsDir
 * @param {string} bypassToken
 * @param {string} outputDir
 * @param {string} runtimeConfigPath
 * @param {InternalBuildConfig} config
 */
async function bundleFunctions(functionsDir, bypassToken, outputDir, runtimeConfigPath, config) {
	const staticManifestPath = await getStaticManifestPath(config);
	const dynamicManifestPath = await getDynamicManifestPath(config);

	const result = await esbuild.build({
		entryPoints: [
			{ in: "vercel://handle.js", out: path.resolve(functionsDir.handler, "index") },
		],
		bundle: true,
		metafile: true,
		//minify: true,
		define: {
			"process.env.NODE_ENV": '"production"',
		},
		plugins: [
			virtual({
				"vercel://handle.js": `
					import * as staticManifest from "${staticManifestPath}";
					import * as dynamicManifest from "${dynamicManifestPath}";
					import runtimeConfig from "${runtimeConfigPath}";
					import { getFrugalHandler } from "vercel://utils.js"

					const handler = getFrugalHandler({ static:staticManifest, dynamic:dynamicManifest }, runtimeConfig, "${config.rootDir}", "${bypassToken}")

					export default handler
				`,
				"vercel://utils.js": await fs.readTextFile(
					new URL(import.meta.resolve("./utils.js")),
				),
			}),
			copy([
				{
					from: path.resolve(config.buildDir, "assets"),
					to: path.resolve(functionsDir.handler, "assets"),
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
		outExtension: { ".js": ".mjs" },
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
