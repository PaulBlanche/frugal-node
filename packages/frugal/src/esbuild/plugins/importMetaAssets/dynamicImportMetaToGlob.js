/** @import * as self from "./dynamicImportMetaToGlob.js" */
/** @import * as swc from "@swc/core" */

import fastGlob from "fast-glob";

const DEFAULT_PROTOCOL = "file:";
const IGNORED_PROTOCOLS = ["data:", "http:", "https:"];

/** @type {self.dynamicImportToGlob} */
export function dynamicImportToGlob(node) {
	const glob = expressionToGlob(node.expression);

	if (shouldIgnore(glob)) {
		return undefined;
	}

	return glob.replace(/\*\*/g, "*");
}

/**
 * @param {string} glob
 * @returns {boolean}
 */
function shouldIgnore(glob) {
	const containsAsterisk = glob.includes("*");

	const globURL = new URL(glob, DEFAULT_PROTOCOL);

	const containsIgnoredProtocol = IGNORED_PROTOCOLS.some(
		(ignoredProtocol) => ignoredProtocol === globURL.protocol,
	);

	return !containsAsterisk || containsIgnoredProtocol;
}

/**
 * @param {swc.Expression} node
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

/**
 * @param {swc.TemplateLiteral} node
 * @returns {string}
 */
function templateLiteralToGlob(node) {
	let glob = "";

	for (let i = 0; i < node.quasis.length; i += 1) {
		glob += sanitizeString(node.quasis[i].cooked ?? "");
		if (node.expressions[i]) {
			glob += expressionToGlob(node.expressions[i]);
		}
	}

	return glob;
}

/**
 * @param {swc.CallExpression} node
 * @returns {string}
 */
function callExpressionToGlob(node) {
	if (
		node.callee.type === "MemberExpression" &&
		node.callee.property.type === "Identifier" &&
		node.callee.property.value === "concat"
	) {
		return `${expressionToGlob(node.callee.object)}${node.arguments
			.map((argument) => expressionToGlob(argument.expression))
			.join("")}`;
	}
	return "*";
}

/**
 * @param {swc.BinaryExpression} node
 * @returns {string}
 */
function binaryExpressionToGlob(node) {
	if (node.operator !== "+") {
		throw new DynamicUrlError(`${node.operator} operator is not supported.`);
	}

	return `${expressionToGlob(node.left)}${expressionToGlob(node.right)}`;
}

/**
 *
 * @param {string} str
 * @returns {string}
 */
function sanitizeString(str) {
	if (str === "") {
		return str;
	}

	if (str.includes("*")) {
		throw new DynamicUrlError("A dynamic URL cannot contain * characters.");
	}

	return fastGlob.escapePath(str);
}

export class DynamicUrlError extends Error {}
