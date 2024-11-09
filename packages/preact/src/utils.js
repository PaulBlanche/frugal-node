/**
 * @param {Node} node
 * @returns {node is Comment}
 */
export function isCommentNode(node) {
	return node.nodeType === 8;
}

/**
 * @param {Node} node
 * @returns {node is Element}
 */
export function isElementNode(node) {
	return node.nodeType === 1;
}

/**
 * @param {Node} node
 * @returns {node is HTMLElement}
 */
export function isHtmlElement(node) {
	return node instanceof HTMLElement;
}

/**
 * @param {Node} node
 * @returns {node is Text}
 */
export function isTextNode(node) {
	return node.nodeType === 3;
}
