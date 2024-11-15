import { NodeType, PatchType } from "./types.js";
import { clone, getAttributes, hash } from "./utils.js";

/** @type {import('./diff.js').diff} */
export function diff(actual, target) {
	/** @type {import("./types.js").NodePatch[]} */
	const patchList = [];
	/** @type {import("./diff.js").DiffQueueItem[]} */
	const queue = [[patchList, actual, target]];

	/** @type {import("./diff.js").DiffQueueItem | undefined} */
	let current;

	let noDiff = false;
	// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a queue (push to the array, shift from the array)
	while ((current = queue.shift()) !== undefined) {
		const [patch, items, inhibit] = visit(current[1], current[2]);

		if (inhibit === true) {
			noDiff = true;
		}

		if (noDiff) {
			current[0].push(preserveNode());
		} else {
			current[0].push(patch);

			if (items !== undefined) {
				queue.push(...items);
			}
		}

		if (inhibit === false) {
			noDiff = false;
		}
	}

	return patchList[0];
}

/**
 * @param {Node | null} [actual]
 * @param {Node | null} [target]
 * @returns {import("./diff.js").VisitResult}
 */
function visit(actual, target) {
	if (actual === undefined || actual === null) {
		if (target === undefined || target === null) {
			return [preserveNode()];
		}

		return [appendNode(target)];
	}

	if (target === undefined || target === null) {
		return [removeNode()];
	}

	if (actual.nodeType !== target.nodeType) {
		return [replaceNode(target)];
	}

	switch (actual.nodeType) {
		case NodeType.COMMENT_NODE: {
			return visitComment(/** @type {Comment} */ (actual), /** @type {Comment} */ (target));
		}
		case NodeType.TEXT_NODE: {
			return visitText(/** @type {Text} */ (actual), /** @type {Text} */ (target));
		}
		case NodeType.ELEMENT_NODE: {
			return visitElement(/** @type {Element} */ (actual), /** @type {Element} */ (target));
		}
		case NodeType.DOCUMENT_NODE: {
			return visit(
				/** @type {Document} */ (actual).documentElement,
				/** @type {Document} */ (target).documentElement,
			);
		}
	}

	return [replaceNode(target)];
}

const START_NO_DIFF_REGEXP = /start-no-diff/;
const END_NO_DIFF_REGEXP = /end-no-diff/;

/**
 * @param {Comment} actual
 * @param {Comment} target
 * @returns {import("./diff.js").VisitResult}
 */
function visitComment(actual, target) {
	if (actual.data.match(START_NO_DIFF_REGEXP) && target.data.match(START_NO_DIFF_REGEXP)) {
		return [preserveNode(), [], true];
	}
	if (target.data.match(END_NO_DIFF_REGEXP)) {
		return [preserveNode(), [], false];
	}
	return [replaceNode(target)];
}

/**
 * @param {Text} actual
 * @param {Text} target
 * @returns {import("./diff.js").VisitResult}
 */
function visitText(actual, target) {
	// text nodes are guaranteed to have a value
	const actualNodeValue = /** @type {string} */ (actual.nodeValue);
	const targetNodeValue = /** @type {string} */ (target.nodeValue);

	if (actualNodeValue === targetNodeValue) {
		return [preserveNode()];
	}

	return [
		{
			type: PatchType.UPDATE_TEXT,
			text: targetNodeValue,
		},
	];
}

/**
 * @param {Element} actual
 * @param {Element} target
 * @returns {import("./diff.js").VisitResult}
 */
function visitElement(actual, target) {
	if (actual.tagName !== target.tagName) {
		return [replaceNode(target)];
	}

	/** @type {import("./types.js").NodePatch} */
	const patch = {
		type: PatchType.UPDATE_ELEMENT,
		children: [],
		attributes: computeAttributePatch(actual, target),
	};

	if (childNodes(actual).length === 0 && childNodes(target).length === 0) {
		return [patch];
	}

	const items =
		actual.tagName !== "HEAD"
			? computeElementPatch(patch, actual, target)
			: computeHeadPatch(
					patch,
					/** @type {HTMLHeadElement} */ (actual),
					/** @type {HTMLHeadElement} */ (target),
				);

	return [patch, items];
}

/**
 * @param {Element} actual
 * @param {Element} target
 * @returns {import("./types.js").AttributePatch[]}
 */
function computeAttributePatch(actual, target) {
	/** @type {import("./types.js").AttributePatch[]} */
	const patches = [];

	/** @type {Map<string, string | boolean>} */
	const removes = new Map();
	/** @type {Map<string, string | boolean>} */
	const sets = new Map();

	for (const [name, value] of getAttributes(actual)) {
		if (value !== false) {
			removes.set(name, value);
		}
	}

	for (const [name, value] of getAttributes(target)) {
		const actualAttributeValue = removes.get(name);
		if (actualAttributeValue === null) {
			// attribute only exists in target, set it
			sets.set(name, value);
		} else if (actualAttributeValue === value) {
			// attribute is the same in both, do not remove
			removes.delete(name);
		} else {
			// attribute is different in both do not remove if value is truthy
			// (different string value or boolean true), would be useless
			if (value) {
				removes.delete(name);
			}
			sets.set(name, value);
		}
	}

	for (const [name] of removes) {
		patches.push({ type: PatchType.REMOVE_ATTRIBUTE, name });
	}

	for (const [name, value] of sets) {
		if (value) {
			patches.push({ type: PatchType.SET_ATTRIBUTE, name, value });
		}
	}

	return patches;
}

/**
 * @param {import("./types.js").UpdateElementPatch} patch
 * @param {Element} actual
 * @param {Element} target
 * @returns {import("./diff.js").DiffQueueItem[]}
 */
function computeElementPatch(patch, actual, target) {
	/** @type {import("./diff.js").DiffQueueItem[]} */
	const items = [];
	const max = Math.max(childNodes(actual).length, childNodes(target).length);

	for (let i = 0; i < max; i++) {
		items.push([patch.children, childNodes(actual)[i], childNodes(target)[i]]);
	}

	return items;
}

/**
 * @param {import("./types.js").UpdateElementPatch} patch
 * @param {HTMLHeadElement} actual
 * @param {HTMLHeadElement} target
 * @returns {import("./diff.js").DiffQueueItem[]}
 */
function computeHeadPatch(patch, actual, target) {
	/** @type {Map<string, Element>} */
	const removes = new Map();
	/** @type {Map<string, Element>} */
	const inserts = new Map();
	/** @type {Map<string, Element>} */
	const updates = new Map();

	for (const actualChild of actual.children) {
		removes.set(headChildHash(actualChild), actualChild);
	}

	for (const targetChild of target.children) {
		const headHash = headChildHash(targetChild);
		const actualChild = removes.get(headHash);
		if (actualChild !== undefined) {
			if (hash(actualChild) !== hash(targetChild) || targetChild.tagName === "SCRIPT") {
				updates.set(headHash, targetChild);
			}
			removes.delete(headHash);
		} else {
			inserts.set(headHash, targetChild);
		}
	}

	/** @type {import("./diff.js").DiffQueueItem[]} */
	const items = [];

	for (const node of childNodes(actual)) {
		if (node.nodeType !== NodeType.ELEMENT_NODE) {
			patch.children.push(preserveNode());
			continue;
		}

		const element = /** @type {Element} */ (node);
		const key = headChildHash(element);

		// node must be removed
		if (removes.has(key)) {
			patch.children.push(removeNode());
			continue;
		}

		// then node must be updated
		const update = updates.get(key);
		if (update !== undefined) {
			if (update.tagName === "SCRIPT") {
				patch.children.push(replaceNode(update));
				continue;
			}
			const [elementPatch, elementItems] = visitElement(element, update);
			patch.children.push(elementPatch);
			elementItems && items.push(...elementItems);
			continue;
		}

		// then node must be preserved
		patch.children.push(preserveNode());
	}

	for (const node of inserts.values()) {
		patch.children.push(appendNode(node));
	}

	return items;
}

/**
 * @param {Element} element
 * @returns {string}
 */
function headChildHash(element) {
	switch (element.tagName) {
		case "BASE":
		case "TITLE":
			return element.tagName;
		case "META": {
			if (element.hasAttribute("name")) {
				return hash(element, ["name"]);
			}
			if (element.hasAttribute("property")) {
				return hash(element, ["property"]);
			}
			if (element.hasAttribute("http-equiv")) {
				return hash(element, ["http-equiv"]);
			}
			return hash(element);
		}
		case "LINK": {
			return hash(element, ["rel", "href"]);
		}
		default: {
			return hash(element);
		}
	}
}

/**
 * @returns {import("./types.js").NodePatch}
 */
function preserveNode() {
	return { type: PatchType.PRESERVE_NODE };
}

/**
 * @returns {import("./types.js").NodePatch}
 */
function removeNode() {
	return { type: PatchType.REMOVE_NODE };
}

/**
 * @param {Node} target
 * @returns {import("./types.js").NodePatch}
 */
function appendNode(target) {
	return {
		type: PatchType.APPEND_NODE,
		node: clone(target),
	};
}

/**
 * @param {Node} target
 * @returns {import("./types.js").NodePatch}
 */
function replaceNode(target) {
	return {
		type: PatchType.REPLACE_NODE,
		node: clone(target),
	};
}

/**
 * @param {Node} node
 * @returns {NodeListOf<ChildNode>}
 */
function childNodes(node) {
	return node.childNodes;
}
