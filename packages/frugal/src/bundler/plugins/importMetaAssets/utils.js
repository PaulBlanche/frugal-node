/**
 * @param {import('@swc/core').Node} [node]
 * @returns {node is import('@swc/core').MemberExpression}
 */
export function isMemberExpression(node) {
	return node?.type === "MemberExpression";
}

/**
 * @param {import('@swc/core').Node} [node]
 * @returns {node is import('@swc/core').MetaProperty}
 */
export function isMetaProperty(node) {
	return node?.type === "MetaProperty";
}

/**
 * @param {import('@swc/core').Node} [node]
 * @returns {node is import('@swc/core').NewExpression}
 */
export function isNewExpression(node) {
	return node?.type === "NewExpression";
}

/**
 * @param {import('@swc/core').Node} [node]
 * @returns {node is import('@swc/core').Identifier}
 */
export function isIdentifier(node) {
	return node?.type === "Identifier";
}

/**
 * @param {import('@swc/core').Node} [node]
 * @returns {node is import('@swc/core').StringLiteral}
 */
export function isStringLiteral(node) {
	return node?.type === "StringLiteral";
}

/**
 * @param {import('@swc/core').Node} [node]
 * @returns {node is import('@swc/core').TemplateLiteral}
 */
export function isTemplateLiteral(node) {
	return node?.type === "TemplateLiteral";
}

/**
 * @param {unknown} value
 * @returns {value is import('@swc/core').Node}
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
 * @param {import('@swc/core').Node} value
 * @returns {value is import('@swc/core').HasSpan}
 */
export function hasSpan(value) {
	return "span" in value && typeof value.span === "object";
}

/**
 * @param {unknown} value
 * @returns {value is import('@swc/core').Argument}
 */
export function isArgument(value) {
	return (
		value !== null &&
		typeof value === "object" &&
		"expression" in value &&
		isNode(value.expression)
	);
}
