/** @import * as self from "./collectAndReplaceMetaAssets.js" */
/** @import { MetaAsset } from "./UrlMetaTransformer.js" */
/** @import * as swc from "@swc/core" */
/** @import { ModuleWalker } from "../../../utils/ModuleWalker.js"; */
/** @import { UrlMetaTransformer } from "./UrlMetaTransformer.js"; */

import * as path from "node:path";
import fastGlob from "fast-glob";
import { Hash } from "../../../utils/Hash.js";
import * as swcAsserts from "../../../utils/swcAsserts.js";
import { DynamicUrlError, dynamicImportToGlob } from "./dynamicImportMetaToGlob.js";

/** @type {self.collectAndReplaceMetaAssets} */
export async function collectAndReplaceMetaAssets(modulePath, walker, transformer) {
	/** @type {MetaAsset[]} */
	const assets = [];

	await walker.walk({
		enter: (node) => {
			if (isDynamicUrlMeta(node) && node.arguments) {
				const source = walker.getSource(node);

				if (source === undefined) {
					return;
				}

				const calleeSource = walker.getSource(node.callee);

				if (calleeSource === undefined) {
					return;
				}

				const glob = dynamicImportToGlob(node.arguments[0]);

				if (glob === undefined) {
					const asset = handleStaticUrlMeta({
						importer: modulePath,
						transformer,
						walker,
						node,
					});

					if (asset) {
						assets.push(asset);
					}

					return;
				}

				validateGlob(glob, source.content);

				const result = fastGlob.sync(glob, { cwd: path.dirname(modulePath) });
				const paths = result.map((r) =>
					r.startsWith("./") || r.startsWith("../") ? r : `./${r}`,
				);
				const serverAssets = paths.map((path) => ({
					importer: modulePath,
					out: metaAssetOut(path),
					path,
				}));

				transformer.dynamicUrl(serverAssets, source.start, calleeSource.end);

				assets.push(...serverAssets);
			} else if (isStaticUrlMeta(node) && node.arguments) {
				const source = walker.getSource(node);

				if (source === undefined) {
					return;
				}

				const asset = handleStaticUrlMeta({
					importer: modulePath,
					transformer,
					node,
					walker,
				});

				if (asset) {
					assets.push(asset);
				}
			}
		},
	});

	return assets;
}

/**
 * @param {{
 *      importer: string,
 *      transformer: UrlMetaTransformer,
 *      node: swc.NewExpression,
 *      walker: ModuleWalker
 * }} args
 * @returns {MetaAsset | undefined}
 */
function handleStaticUrlMeta({ importer, transformer, node, walker }) {
	let assetPath;

	if (!node.arguments) {
		return;
	}

	const argument = node.arguments[0];
	if (swcAsserts.isStringLiteral(argument.expression)) {
		assetPath = argument.expression.value;
	}

	if (swcAsserts.isTemplateLiteral(argument.expression)) {
		assetPath = "";
		for (let i = 0; i < argument.expression.quasis.length; i++) {
			const quasi = argument.expression.quasis[i];
			assetPath += quasi.cooked ?? "";
			if (quasi.tail) {
				break;
			}

			const expression = argument.expression.expressions[i];
			if (expression.type !== "StringLiteral" && expression.type !== "NumericLiteral") {
				assetPath = undefined;
				break;
			}
			assetPath += String(expression.value);
		}
	}

	if (assetPath) {
		const source = walker.getSource(node);

		if (source === undefined) {
			return;
		}

		validatePath(assetPath, source.content);

		const serverAsset = {
			importer,
			out: metaAssetOut(assetPath),
			path: assetPath,
		};

		transformer.staticUrl(serverAsset, source.start, source.end);

		return serverAsset;
	}
}

/**
 * @param {string} assetPath
 */
function metaAssetOut(assetPath) {
	const hash = Hash.create().update(assetPath).digest();
	const ext = path.extname(assetPath);
	const filename = path.basename(assetPath, ext);

	return `./assets/${filename}-${hash}${ext}`;
}

/**
 * @param {swc.Node} node
 * @returns {node is swc.NewExpression}
 */
function isDynamicUrlMeta(node) {
	return (
		isUrlMeta(node) &&
		swcAsserts.isTemplateLiteral(node.arguments?.[0].expression) &&
		node.arguments?.[0].expression.expressions.length > 0
	);
}

/**
 * @param {swc.Node} node
 * @returns {node is swc.NewExpression}
 */
function isStaticUrlMeta(node) {
	return (
		isUrlMeta(node) &&
		(swcAsserts.isStringLiteral(node.arguments?.[0].expression) ||
			(swcAsserts.isTemplateLiteral(node.arguments?.[0].expression) &&
				node.arguments?.[0].expression.expressions.length === 0))
	);
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.NewExpression}
 */
function isUrlMeta(node) {
	return (
		swcAsserts.isNewExpression(node) &&
		swcAsserts.isIdentifier(node.callee) &&
		node.callee.value === "URL" &&
		node.arguments?.length === 2 &&
		isMetaUrlProperty(node.arguments[1].expression)
	);
}

/**
 *
 * @param {swc.Node} node
 */
function isMetaUrlProperty(node) {
	return (
		swcAsserts.isMemberExpression(node) &&
		swcAsserts.isMetaProperty(node.object) &&
		swcAsserts.isIdentifier(node.property) &&
		node.property.value === "url"
	);
}

const example = "For example: new URL(`./foo/${bar}.js`, import.meta.url).";

/**
 * @param {string} glob
 * @param {string} source
 */
function validateGlob(glob, source) {
	if (glob.startsWith("*")) {
		throw new DynamicUrlError(
			`invalid meta URL "${source}". It cannot be statically analyzed. Dynamic URLs must start with ./ and be limited to a specific directory. ${example}`,
		);
	}

	if (glob.startsWith("/")) {
		throw new DynamicUrlError(
			`invalid meta URL "${source}". Dynamic absolute URLS are not supported, URLS must start with ./ in the static part. ${example}`,
		);
	}

	if (!(glob.startsWith("./") || glob.startsWith("../"))) {
		throw new DynamicUrlError(
			`invalid meta URL "${source}". Dynamic bare URLS are not supported, URLS must start with ./ in the static part. ${example}`,
		);
	}

	// Disallow ./*.ext
	const ownDirectoryStarExtension = /^\.\/\*\.[\w]+$/;
	if (ownDirectoryStarExtension.test(glob)) {
		throw new DynamicUrlError(
			`invalid meta URL "${source}". Dynamic URLS cannot import their own directory, place assets in a separate directory or make the URL filename more specific. ${example}`,
		);
	}

	if (path.extname(glob) === "") {
		throw new DynamicUrlError(
			`invalid meta URL "${source}". A file extension must be included in the static part of the URL. ${example}`,
		);
	}
}

/**
 * @param {string} path
 * @param {string} source
 */
function validatePath(path, source) {
	if (!(path.startsWith("./") || path.startsWith("../"))) {
		throw new DynamicUrlError(
			`invalid meta URL "${source}". Dynamic bare URLS are not supported, URLS must start with ./ in the static part. ${example}`,
		);
	}
}
