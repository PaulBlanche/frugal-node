import * as path from "node:path";
import * as url from "node:url";
import * as esbuild from "esbuild";
import * as config from "frugal-node/config";
import * as exporter from "frugal-node/exporter";
import * as fs from "frugal-node/utils/fs";

/**
 * @returns {exporter.Exporter}
 */
export function vercel() {
	return {
		name: "vercel",
		async export(context) {
			const vercelDir = path.resolve(context.config.rootDir, ".vercel");
			const outputDir = path.resolve(vercelDir, "output");
			const functionDir = path.resolve(outputDir, "functions/index.func");

			await output(path.resolve(outputDir, "config.json"), globalConfigContent());

			await output(path.resolve(functionDir, ".vc-config.json"), functionConfigContent());

			await populate(context.config);

			await bundleFunction(functionDir, context.config);
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

function functionConfigContent() {
	return JSON.stringify({
		handler: "index.js",
		runtime: "nodejs18.x",
		launcherType: "Nodejs",
	});
}

function globalConfigContent() {
	return JSON.stringify({
		version: 3,
		routes: [{ handle: "filesystem" }, { src: "^(?:/(.*))$", dest: "/", check: true }],
	});
}

/**
 * @param {config.FrugalConfig} config
 */
async function populate(config) {
	const { kv } = await import("@vercel/kv");

	const cacheSnapshot = await exporter.snapshot({ dir: config.buildCacheDir });

	await kv.flushall();
	await Promise.all(
		cacheSnapshot.current.map(async (entry) =>
			kv.set(entry.path, {
				path: entry.path,
				hash: entry.hash,
				body: await cacheSnapshot.read(entry),
				headers: entry.headers,
				status: entry.status,
			}),
		),
	);
}

/**
 * @param {string} functionDir
 * @param {config.FrugalConfig} config
 */
async function bundleFunction(functionDir, config) {
	const loadedManifest = await exporter.loadManifest(config);

	await esbuild.build({
		stdin: {
			contents: `
				import { KvStorage } from "${url.fileURLToPath(
					new URL(import.meta.url, "./KvStorage.js"),
				)}";
				import { Server, Cache } from 'frugal/server';
				import config from "frugal-node:config";
				import * as manifest from "frugal-node:manifest";

				const server = new Server({
					config,
					watch: false,
					manifest,
					cache: new Cache(new KvStorage()),
		
				})

				module.exports = server.nativeHandler(true)
				`,
			resolveDir: functionDir,
		},
		bundle: true,
		metafile: true,
		minify: true,
		define: {
			"process.env.NODE_ENV": '"production"',
		},
		plugins: [
			{
				name: "resolver",
				setup(build) {
					build.onResolve({ filter: /^frugal:config$/ }, async () => {
						return { path: "config", namespace: "frugal" };
					});
					build.onLoad({ filter: /^config$/, namespace: "frugal" }, () => {
						return {
							contents: `export default ${JSON.stringify(config.runtime)}`,
							resolveDir: functionDir,
						};
					});
					build.onResolve({ filter: /^frugal:manifest$/ }, async () => {
						return { path: "manifest", namespace: "frugal" };
					});
					build.onLoad({ filter: /^manifest$/, namespace: "frugal" }, () => {
						return {
							contents: exporter.manifestContent(
								{
									rootDir: config.rootDir,
									outDir: functionDir,
								},
								loadedManifest,
							),
							resolveDir: functionDir,
						};
					});
				},
			},
		],
		loader: { ".node": "file" },
		platform: "node",
		format: "cjs",
		absWorkingDir: config.rootDir,
		outfile: path.resolve(functionDir, "index.js"),
	});
}
