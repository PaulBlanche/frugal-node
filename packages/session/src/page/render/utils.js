import { NodeType } from "./types.js";

/**
 * @param {Node} node
 * @returns {Node}
 */
export function clone(node) {
	if (isScriptElement(node)) {
		// for scripts cloning is not enough, we need to recreate the script
		// element for it to be loaded/evaluated again
		const script = document.createElement("script");
		for (const attribute of node.attributes) {
			script.setAttribute(attribute.name, attribute.value);
		}
		script.innerHTML = node.innerHTML;
		return script;
	}
	return node.cloneNode(true);
}

/**
 *
 * @param {Node} node
 * @returns {node is HTMLScriptElement}
 */
function isScriptElement(node) {
	return isElement(node) && node.nodeName === "SCRIPT";
}

/**
 *
 * @param {Node} node
 * @returns {node is Element}
 */
export function isElement(node) {
	return node.nodeType === NodeType.ELEMENT_NODE;
}

/**
 *
 * @param {Element} element
 * @param {string[]} [attributeFilter]
 * @returns {string}
 */
export function hash(element, attributeFilter) {
	const key = [];

	if (attributeFilter) {
		for (const name of attributeFilter) {
			const value = element.getAttribute(name);
			if (value) {
				key.push(`${name}="${element.getAttribute(name)}"`);
			}
		}
	} else {
		for (const attribute of element.attributes) {
			key.push(`${attribute.name}="${attribute.value}"`);
		}
	}

	key.sort();

	return `${element.tagName} ${key.join(" ")} ${element.innerHTML}`;
}

const BOOLEAN_ATTRIBUTES = [
	"allowfullscreen",
	"async",
	"autofocus",
	"autoplay",
	"checked",
	"controls",
	"default",
	"defer",
	"disabled",
	"formnovalidate",
	"inert",
	"ismap",
	"itemscope",
	"loop",
	"multiple",
	"muted",
	"nomodule",
	"novalidate",
	"open",
	"playsinline",
	"readonly",
	"required",
	"reversed",
	"selected",
];

/** @typedef {[name: string, value: string | boolean]} Attribute */

/**
 *
 * @param {Element} element
 * @returns {Attribute[]}
 */
export function getAttributes(element) {
	/** @type {Record<string, string | boolean>} */
	const attributes = {};

	for (const { name, value } of element.attributes) {
		attributes[name] = value;
	}

	for (const name of BOOLEAN_ATTRIBUTES) {
		attributes[name] = element.hasAttribute(name);
	}

	return Object.entries(attributes);
}
