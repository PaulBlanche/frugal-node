import * as path from "node:path";
import { Hash } from "@frugal-node/core/utils/Hash";
import * as fs from "@frugal-node/core/utils/fs";
import { SpritesheetBundler } from "./SpritesheetBundler.js";
import { SymbolBuilder } from "./SymbolBuilder.js";

const DEFAULT_FILTER = /\.svg$/;

/** @type {import('./svg.ts').svg} */
export function svg(options = {}) {
	const outdir = options.outdir ?? "svg/";
	const filter = options.filter ?? DEFAULT_FILTER;
	const getSpritsheetName =
		options.getSpritesheetName ?? ((filePath) => path.basename(path.dirname(filePath)));

	return {
		name: "frugal:svg",
		setup(build, context) {
			const spritesheetBundler = SpritesheetBundler.create();
			const symbolBuilder = SymbolBuilder.create();
			/** @type {Map<string, string>} */
			const spritesheetNameCache = new Map();

			build.onStart(async () => {
				try {
					await fs.remove(path.resolve(context.buildConfig.publicDir, outdir), {
						recursive: true,
					});
				} catch (error) {
					if (!(error instanceof fs.NotFound)) {
						throw error;
					}
				}
			});

			build.onResolve({ filter }, (args) => {
				return { path: path.resolve(args.resolveDir, args.path) };
			});

			build.onLoad({ filter }, async (args) => {
				const symbol = await symbolBuilder.build(args.path);
				const spritesheetName = _getSpritesheetName(args.path);

				return {
					contents: JSON.stringify({
						href: `/${outdir}${spritesheetName}#${symbol.id}`,
						viewBox: symbol.viewBox,
					}),
					loader: "json",
				};
			});

			build.onEnd(async (result) => {
				const metafile = result.metafile;
				const errors = result.errors;

				if (errors.length > 0 || metafile === undefined) {
					return;
				}

				const assets = context.collectModules(filter, metafile);

				/**@type {Record<string, import("./SymbolBuilder.js").SvgSymbol[]>} */
				const spritesheets = {};

				await Promise.all(
					assets.map(async (asset) => {
						const symbol = await symbolBuilder.build(asset.path);
						const spritesheetName = _getSpritesheetName(asset.path);

						spritesheets[spritesheetName] = spritesheets[spritesheetName] ?? [];
						spritesheets[spritesheetName].push(symbol);
					}),
				);

				for (const [name, symbols] of Object.entries(spritesheets)) {
					const svg = spritesheetBundler.bundle(name, symbols);
					const svgAssetPath = path.join("svg", `${name}`);
					const svgPath = path.resolve(context.buildConfig.publicDir, svgAssetPath);

					context.output("svg", {
						type: "svg",
						scope: "global",
						path: `/${svgAssetPath}`,
					});

					await fs.ensureFile(svgPath);
					await fs.writeTextFile(svgPath, svg);
				}
			});

			/**
			 * @param {string} filePath
			 * @returns {string}
			 */
			function _getSpritesheetName(filePath) {
				const baseName = getSpritsheetName(filePath);

				const name = spritesheetNameCache.get(baseName);
				if (name !== undefined) {
					return name;
				}

				const hash = Hash.create().update(baseName).update(String(Date.now())).digest();
				const spritesheetName = `${baseName}-${hash}.svg`;
				spritesheetNameCache.set(baseName, spritesheetName);

				return spritesheetName;
			}
		},
	};
}
