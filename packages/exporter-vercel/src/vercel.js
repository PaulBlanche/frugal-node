import * as path from "node:path";
import * as url from "node:url";
import * as esbuild from "esbuild";
import { Snapshot, getManifestPath } from "frugal-node/exporter";
import * as fs from "frugal-node/utils/fs";

/**
 * @returns {import("frugal-node/exporter").Exporter}
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

			await bundleFunction(functionDir, outputDir, context.config);
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
 * @param {import("frugal-node/config").FrugalConfig} config
 */
async function populate(config) {
	const { kv } = await import("@vercel/kv");

	const cacheSnapshot = await Snapshot.load({ dir: config.buildCacheDir });

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
 * @param {string} outputDir
 * @param {import("frugal-node/config").FrugalConfig} config
 */
async function bundleFunction(functionDir, outputDir, config) {
	const manifestPath = await getManifestPath(config);

	const result = await esbuild.build({
		stdin: {
			contents: `
				import { KvStorage } from "${url.fileURLToPath(
					new URL("./KvStorage.js", import.meta.url),
				)}";
				import { Server, ServerCache } from 'frugal-node/server';
				import * as manifest from "${manifestPath}";

				const handlerPromise = Server.create({
					config: manifest.config,
					watch: false,
					manifest,
					cache: ServerCache.create(new KvStorage()),
				}).then(server => server.nativeHandler(true))

				module.exports = async (req, res) => {
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
				name: "frugal-internal:copy",
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
						} catch (/** @type {any} */ error) {
							if (!(error instanceof fs.NotFound)) {
								throw error;
							}
						}
					});
				},
			},
		],
		loader: { ".node": "file" },
		platform: "node",
		format: "cjs",
		logOverride: {
			"empty-import-meta": "silent",
		},
		inject: [url.fileURLToPath(new URL("./import-meta-shim.js", import.meta.url))],
		absWorkingDir: config.rootDir,
		outfile: path.resolve(functionDir, "index.js"),
	});

	await fs.writeTextFile(path.resolve(outputDir, "meta.json"), JSON.stringify(result.metafile));
}
