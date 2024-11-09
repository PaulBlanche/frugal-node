/** @import * as swc from "@swc/core" */

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.ImportDeclaration}
 */
export function isImportDeclaration(node) {
	return node?.type === "ImportDeclaration";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.CallExpression}
 */
export function isCallExpression(node) {
	return node?.type === "CallExpression";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.MemberExpression}
 */
export function isMemberExpression(node) {
	return node?.type === "MemberExpression";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.MetaProperty}
 */
export function isMetaProperty(node) {
	return node?.type === "MetaProperty";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.NewExpression}
 */
export function isNewExpression(node) {
	return node?.type === "NewExpression";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.Identifier}
 */
export function isIdentifier(node) {
	return node?.type === "Identifier";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.StringLiteral}
 */
export function isStringLiteral(node) {
	return node?.type === "StringLiteral";
}

/**
 * @param {swc.Node} [node]
 * @returns {node is swc.TemplateLiteral}
 */
export function isTemplateLiteral(node) {
	return node?.type === "TemplateLiteral";
}

/**
 * @param {unknown} value
 * @returns {value is swc.Node}
 */
export function isNode(value) {
	return (
		value !== null &&
		typeof value === "object" &&
		"type" in value &&
		typeof value.type === "string"
	);
}

/**
 *
 * @param {swc.Node} value
 * @returns {value is swc.HasSpan}
 */
export function hasSpan(value) {
	return "span" in value && typeof value.span === "object";
}

/**
 * @param {unknown} value
 * @returns {value is swc.Argument}
 */
export function isArgument(value) {
	return (
		value !== null &&
		typeof value === "object" &&
		"expression" in value &&
		isNode(value.expression)
	);
}
