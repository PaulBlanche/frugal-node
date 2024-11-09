/** @import { InternalBuildConfig } from "@frugal-node/core/config/build" */
/** @import { BuildSnapshot } from "@frugal-node/core/exporter" */

import * as path from "node:path";
import * as url from "node:url";
import { getManifestPath, loadManifest } from "@frugal-node/core/exporter";
import * as fs from "@frugal-node/core/utils/fs";
import * as esbuild from "esbuild";
import { functionConfigContent, globalConfigContent } from "./utils.js";

/** @type {import("./vercel.ts").vercel} */
export function vercel() {
	return {
		name: "vercel",
		async export(context) {
			const vercelDir = path.resolve(context.config.rootDir, ".vercel");
			const outputDir = path.resolve(vercelDir, "output");
			const functionDir = path.resolve(outputDir, "functions/index.func");

			await output(
				path.resolve(outputDir, "config.json"),
				JSON.stringify(globalConfigContent(), null, 2),
			);

			await output(
				path.resolve(functionDir, ".vc-config.json"),
				JSON.stringify(functionConfigContent(), null, 2),
			);

			await output(
				path.resolve(functionDir, "package.json"),
				JSON.stringify({ type: "module" }),
			);

			await bundleFunction(functionDir, outputDir, context.config);

			await populate(context.snapshot);
		},
	};
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
 * @param {BuildSnapshot} snapshot
 */
async function populate(snapshot) {
	const { kv } = await import("@vercel/kv");

	await kv.flushall();
	console.log("ok");
	for (const entry of snapshot.current) {
		console.log("set", entry.path);
		await kv.set(entry.path, {
			path: entry.path,
			hash: entry.hash,
			body: await snapshot.getBody(entry),
			headers: entry.headers,
			status: entry.status,
		});
	}
}

/**
 * @param {string} functionDir
 * @param {string} outputDir
 * @param {InternalBuildConfig} config
 */
async function bundleFunction(functionDir, outputDir, config) {
	const manifestPath = await getManifestPath(config);
	const manifest = await loadManifest(config);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import * as path from "node:path"
				import { KvStorage } from "${url.fileURLToPath(
					new URL("./KvStorage.js", import.meta.url),
				)}";
				import { Server, ServerCache } from '@frugal-node/core/server';
				import { RuntimeConfig } from '@frugal-node/core/config/runtime';
				import * as manifest from "${manifestPath}";
				import runtimeConfig from "${path.resolve(config.outDir, manifest.runtimeConfig)}";

				const internalRuntimeConfig = RuntimeConfig.create(runtimeConfig);

				const handlerPromise = Server.create({
					config: internalRuntimeConfig,
					publicDir: undefined,
					watch: false,
					manifest,
					cache: ServerCache.create(KvStorage.create()),
				}).then(server => server.nativeHandler(true))

				export default async function handler (req, res) {
					const handler = await handlerPromise
					await handler(req,res)
				}
				`,
			resolveDir: functionDir,
		},
		bundle: true,
		metafile: true,
		//minify: true,
		define: {
			"process.env.NODE_ENV": '"production"',
		},
		plugins: [
			{
				name: "frugal-internal-plugin:copy",
				setup(build) {
					build.onEnd(async () => {
						try {
							await fs.copy(
								path.resolve(config.buildDir, "assets"),
								path.resolve(functionDir, "assets"),
								{
									overwrite: true,
									recursive: true,
								},
							);
							await fs.copy(config.publicDir, path.resolve(outputDir, "static"), {
								overwrite: true,
								recursive: true,
							});
						} catch (/** @type {any} */ error) {
							if (!(error instanceof fs.NotFound)) {
								throw error;
							}
						}
					});
				},
			},
		],
		sourcemap: false,
		loader: { ".node": "file" },
		platform: "node",
		format: "esm",
		logOverride: {
			"empty-import-meta": "silent",
		},
		absWorkingDir: config.rootDir,
		outfile: path.resolve(functionDir, "index.mjs"),
	});

	await fs.writeTextFile(path.resolve(outputDir, "meta.json"), JSON.stringify(result.metafile));
}
