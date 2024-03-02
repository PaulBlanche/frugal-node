import path from "node:path";
import fastGlob from "fast-glob";

export class VariableDynamicUrlMetaError extends Error {}

const example = "For example: new URL(`./foo/${bar}.js`, import.meta.url).";

/**
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
	if (str === "") return str;
	if (str.includes("*")) {
		throw new VariableDynamicUrlMetaError("A new URL() path cannot contain * characters.");
	}
	return fastGlob.escapePath(str);
}

/**
 * @param {import('@swc/core').TemplateLiteral} node
 * @returns
 */
function templateLiteralToGlob(node) {
	let glob = "";

	for (let i = 0; i < node.quasis.length; i += 1) {
		glob += sanitizeString(node.quasis[i].raw);
		if (node.expressions[i]) {
			glob += expressionToGlob(node.expressions[i]);
		}
	}

	return glob;
}

/**
 * @param {import('@swc/core').CallExpression} node
 * @returns
 */
function callExpressionToGlob(node) {
	const { callee } = node;
	if (
		callee.type === "MemberExpression" &&
		callee.property.type === "Identifier" &&
		callee.property.value === "concat"
	) {
		return `${expressionToGlob(callee.object)}${node.arguments
			.map((argument) => expressionToGlob(argument.expression))
			.join("")}`;
	}
	return "*";
}

/**
 * @param {import('@swc/core').BinaryExpression} node
 * @returns
 */
function binaryExpressionToGlob(node) {
	if (node.operator !== "+") {
		throw new VariableDynamicUrlMetaError(`${node.operator} operator is not supported.`);
	}

	return `${expressionToGlob(node.left)}${expressionToGlob(node.right)}`;
}

/**
 * @param {import('@swc/core').Expression} node
 * @returns {string}
 */
function expressionToGlob(node) {
	switch (node.type) {
		case "TemplateLiteral":
			return templateLiteralToGlob(node);
		case "CallExpression":
			return callExpressionToGlob(node);
		case "BinaryExpression":
			return binaryExpressionToGlob(node);
		case "StringLiteral": {
			return sanitizeString(node.value);
		}
		default:
			return "*";
	}
}

const defaultProtocol = "file:";
const ignoredProtocols = ["data:", "http:", "https:"];

/**
 * @param {string} glob
 * @returns {boolean}
 */
function shouldIgnore(glob) {
	const containsAsterisk = glob.includes("*");

	const globURL = new URL(glob, defaultProtocol);

	const containsIgnoredProtocol = ignoredProtocols.some(
		(ignoredProtocol) => ignoredProtocol === globURL.protocol,
	);

	return !containsAsterisk || containsIgnoredProtocol;
}

/**
 *
 * @param {import('@swc/core').Expression} node
 * @param {string} sourceString
 * @returns {string|undefined}
 */
export function dynamicUrlMetaToGlob(node, sourceString) {
	let glob = expressionToGlob(node);

	if (shouldIgnore(glob)) {
		return undefined;
	}

	glob = glob.replace(/\*\*/g, "*");

	if (glob.startsWith("*")) {
		throw new VariableDynamicUrlMetaError(
			`invalid path "${sourceString}". It cannot be statically analyzed. Variable path must start with ./ and be limited to a specific directory. ${example}`,
		);
	}

	if (glob.startsWith("/")) {
		throw new VariableDynamicUrlMetaError(
			`invalid path "${sourceString}". Variable absolute paths are not supported, paths must start with ./ in the static part of the path. ${example}`,
		);
	}

	if (!glob.startsWith("./") && !glob.startsWith("../")) {
		throw new VariableDynamicUrlMetaError(
			`invalid path "${sourceString}". Variable bare paths are not supported, paths must start with ./ in the static part of the path. ${example}`,
		);
	}

	// Disallow ./*.ext
	const ownDirectoryStarExtension = /^\.\/\*\.[\w]+$/;
	if (ownDirectoryStarExtension.test(glob)) {
		throw new VariableDynamicUrlMetaError(
			`invalid path "${sourceString}". Variable paths cannot import their own directory, place imports in a separate directory or make the path filename more specific. ${example}`,
		);
	}

	if (path.extname(glob) === "") {
		throw new VariableDynamicUrlMetaError(
			`invalid import "${sourceString}". A file extension must be included in the static part of the path. ${example}`,
		);
	}

	return glob;
}
