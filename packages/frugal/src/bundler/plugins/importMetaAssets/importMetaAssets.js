import * as path from "node:path";
import fastGlob from "fast-glob";
import { Hash } from "../../../utils/Hash.js";
import * as fs from "../../../utils/fs.js";
import { ModuleWalker } from "./ModuleWalker.js";
import { UrlMetaTransformer } from "./UrlMetaTransformer.js";
import { dynamicUrlMetaToGlob } from "./dynamicUrlMetaToGlob.js";
import * as utils from "./utils.js";

/** @type {import('./importMetaAssets.js').importMetaAssets} */
export function importMetaAssets(config) {
	return {
		name: "frugal-internal:importMetaAssets",
		setup(build) {
			/** @type {import('./UrlMetaTransformer.ts').ServerAsset[]} */
			const assets = [];

			build.onLoad({ filter: /^.*\.[tj]sx?$/, namespace: "file" }, async (args) => {
				const walker = await ModuleWalker.create(args.path);
				const transformer = UrlMetaTransformer.create(walker.code);

				await walker.walk({
					enter: (node, getSource) => {
						if (isDynamicUrlMeta(node) && node.arguments?.[0] !== undefined) {
							const source = getSource();

							if (source === undefined) {
								return;
							}

							const serverAssets = collectDynamicUrlMeta(
								node.arguments?.[0].expression,
								source.content,
								args.path,
							);

							if (serverAssets === undefined) {
								return;
							}

							transformer.dynamicUrl(serverAssets, source.start);

							assets.push(...serverAssets);
						}

						if (isStaticUrlMeta(node) && node.arguments?.[0] !== undefined) {
							let relativePath;

							if (utils.isStringLiteral(node.arguments?.[0].expression)) {
								relativePath = node.arguments?.[0].expression.value;
							}

							if (
								utils.isTemplateLiteral(node.arguments?.[0].expression) &&
								node.arguments?.[0].expression.quasis[0].cooked
							) {
								relativePath = node.arguments?.[0].expression.quasis[0].cooked;
							}

							if (relativePath) {
								const source = getSource();

								if (source === undefined) {
									return;
								}

								const serverAsset = {
									importer: args.path,
									out: serverAssetOut(relativePath),
									path: relativePath,
								};

								transformer.staticUrl(serverAsset, source.start, source.stop);

								assets.push(serverAsset);
							}
						}
					},
				});

				return {
					contents: transformer.contents,
					resolveDir: path.dirname(args.path),
					loader: "ts",
				};
			});

			build.onEnd(async () => {
				for (const asset of assets) {
					const from = path.resolve(path.dirname(asset.importer), asset.path);

					const to = path.resolve(config.buildDir, asset.out);
					await fs.copy(from, to, {
						overwrite: true,
						recursive: false,
					});
				}
			});
		},
	};
}

/**
 * @param {string} relativePath
 */
function serverAssetOut(relativePath) {
	const hash = Hash.create().update(relativePath).digest();
	const ext = path.extname(relativePath);
	const filename = path.basename(relativePath, ext);

	return `./assets/${filename}-${hash}${ext}`;
}

/**
 *
 * @param {import('@swc/core').Expression} node
 * @param {string} sourceString
 * @param {string} importer
 * @returns {import('./UrlMetaTransformer.ts').ServerAsset[]|undefined}
 */
function collectDynamicUrlMeta(node, sourceString, importer) {
	const glob = dynamicUrlMetaToGlob(node, sourceString);

	if (glob === undefined) {
		return undefined;
	}

	const paths = fastGlob.sync(glob, { cwd: path.dirname(importer) });

	return paths.map((assetPath) => {
		const relativePath =
			assetPath.startsWith("./") || assetPath.startsWith("../")
				? assetPath
				: `./${assetPath}`;

		return { path: relativePath, out: serverAssetOut(relativePath), importer };
	});
}

/**
 * @param {import('@swc/core').Node} node
 * @returns {node is import('@swc/core').NewExpression}
 */
function isDynamicUrlMeta(node) {
	return (
		isNewUrl(node) &&
		utils.isTemplateLiteral(node.arguments?.[0].expression) &&
		node.arguments?.[0].expression.expressions.length > 0 &&
		isMetaUrl(node.arguments?.[1].expression)
	);
}

/**
 * @param {import('@swc/core').Node} node
 * @returns {node is import('@swc/core').NewExpression}
 */
function isStaticUrlMeta(node) {
	return (
		isNewUrl(node) &&
		(utils.isStringLiteral(node.arguments?.[0].expression) ||
			(utils.isTemplateLiteral(node.arguments?.[0].expression) &&
				node.arguments?.[0].expression.expressions.length === 0)) &&
		isMetaUrl(node.arguments?.[1].expression)
	);
}

/**
 * @param {import('@swc/core').Node} node
 * @returns {node is import('@swc/core').NewExpression}
 */
function isNewUrl(node) {
	return (
		utils.isNewExpression(node) &&
		utils.isIdentifier(node.callee) &&
		node.callee.value === "URL"
	);
}

/**
 * @param {import('@swc/core').Node} [node]
 * @returns {boolean}
 */
function isMetaUrl(node) {
	return (
		utils.isMemberExpression(node) &&
		utils.isMetaProperty(node.object) &&
		utils.isIdentifier(node.property) &&
		node.property.value === "url"
	);
}
