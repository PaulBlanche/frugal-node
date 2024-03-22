import * as path from "node:path";
import * as fs from "frugal-node/utils/fs";
import { Hash } from "frugal-node/utils/hash";
import { CONTINUE, EXIT, visit } from "unist-util-visit";
import { fromXml } from "xast-util-from-xml";

/** @type {import('./SymbolBuilder.ts').SymbolBuilderMaker} */
export const SymbolBuilder = {
	create,
};

/** @type {import('./SymbolBuilder.ts').SymbolBuilderMaker['create']} */
function create() {
	/** @type {Map<string, import('./SymbolBuilder.ts').SvgSymbol>} */
	const cache = new Map();

	return {
		build,
	};

	/** @type {import('./SymbolBuilder.ts').SymbolBuilder['build']} */
	async function build(filePath) {
		const svgString = await fs.readTextFile(filePath);
		const hash = Hash.create().update(svgString).digest();

		const cached = cache.get(hash);
		if (cached !== undefined) {
			return cached;
		}

		const parsedSvg = fromXml(svgString);
		const svg = find(
			parsedSvg,
			/** @returns {node is import("xast").Element}*/ (node) =>
				isElement(node) && node.name === "svg",
		);

		if (svg === undefined) {
			throw Error("no <svg> tag found");
		}

		const viewBox = svg.attributes["viewBox"] ?? undefined;
		const width = svg.attributes["width"] ?? undefined;
		const height = svg.attributes["height"] ?? undefined;
		if (!viewBox && (!width || !height)) {
			throw Error("no <svg> with no viewBox or width/height");
		}

		const defs = findAll(
			svg,
			/** @returns {node is import("xast").Element}*/ (node) =>
				isElement(node) && node.name === "defs",
		);

		removeAll(svg, (node) => isElement(node) && node.name === "defs");

		/** @type {import("./SymbolBuilder.ts").SvgSymbol} */
		const symbol = {
			viewBox: viewBox ?? `0 0 ${width} ${height}`,
			path: filePath,
			id: hash,
			svg: {
				attributes: svg.attributes,
				gatheredIds: gatherAllIds(svg),
				defs: defs,
				content: svg,
			},
		};

		cache.set(hash, symbol);

		return symbol;
	}
}

/**
 * @param {import("unist").Node} node
 * @returns {node is import('xast').Element}
 */
function isElement(node) {
	return node.type === "element";
}

/**
 * @template {import("unist").Node} NODE
 * @param {import("unist").Parent} tree
 * @param {(node:import("unist").Node) => node is NODE} predicate
 * @returns {NODE|undefined}
 */
function find(tree, predicate) {
	/** @type {NODE|undefined} */
	let result = undefined;

	visit(tree, (node) => {
		if (predicate(node)) {
			result = node;
			return EXIT;
		}
	});

	return result;
}

/**
 * @template {import("unist").Node} NODE
 * @param {import("unist").Parent} tree
 * @param {(node:import("unist").Node) => node is NODE} predicate
 * @returns {NODE[]}
 */
function findAll(tree, predicate) {
	/** @type {NODE[]} */
	const result = [];

	visit(tree, (node) => {
		if (predicate(node)) {
			result.push(node);
			return CONTINUE;
		}
	});

	return result;
}

/**
 * @param {import("unist").Parent} tree
 * @param {(node:import("unist").Node) => boolean} predicate
 */
function removeAll(tree, predicate) {
	visit(tree, (node, index, parent) => {
		if (predicate(node) && index) {
			parent?.children.splice(index, 1);
			return EXIT;
		}
	});
}

/**
 * @param {import('xast').Element|import('xast').Root} tree
 * @returns {string[]}
 */
function gatherAllIds(tree) {
	/** @type {string[]} */
	const ids = [];

	visit(tree, (node) => {
		if (!isElement(node)) {
			return EXIT;
		}

		const id = node.attributes["id"] ?? undefined;
		if (id !== undefined) {
			ids.push(id);
		}

		return CONTINUE;
	});

	return ids;
}
