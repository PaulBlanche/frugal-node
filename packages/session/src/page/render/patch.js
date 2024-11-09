import { PatchType } from "./types.js";
import { isElement } from "./utils.js";

/**
 * @param {import("./types.js").NodePatch} patch
 * @param {Node} target
 */
export function patch(patch, target) {
	/** @type {import("./patch.js").PatchQueueItem[]} */
	const queue = [];
	queue.push({
		patch,
		parent: target,
	});

	/** @type {import("./patch.js").PatchQueueItem | undefined} */
	let current;

	// biome-ignore lint/suspicious/noAssignInExpressions: here assignment is legitimate to iterate on a queue (unshift to the array, shift from the array)
	while ((current = queue.shift()) !== undefined) {
		const { items } = patchNode(current.patch, current.parent, current.child);

		if (items) {
			queue.unshift(...items);
		}
	}
}

/**
 * @param {import("./types.js").NodePatch} patch
 * @param {Node} parent
 * @param {Node} [child]
 * @returns
 */
function patchNode(patch, parent, child) {
	switch (patch.type) {
		case PatchType.PRESERVE_NODE: {
			return {};
		}
		case PatchType.APPEND_NODE: {
			parent.appendChild(patch.node);
			return {};
		}
		case PatchType.REMOVE_NODE: {
			if (!child) {
				return {};
			}

			parent.removeChild(child);
			return {};
		}
		case PatchType.UPDATE_TEXT: {
			if (!child) {
				return {};
			}

			child.nodeValue = patch.text;
			return {};
		}
		case PatchType.REPLACE_NODE: {
			if (!child) {
				return {};
			}

			parent.replaceChild(patch.node, child);
			return {};
		}
		case PatchType.UPDATE_ELEMENT: {
			const element = child ?? parent;
			if (element && isElement(element)) {
				patchAttribute(element, patch.attributes);
			}

			return {
				items: patch.children.map((childPatch, index) => ({
					patch: childPatch,
					parent: element,
					child: element.childNodes[index],
				})),
			};
		}
	}
}

/**
 * @param {Element} element
 * @param {import("./types.js").AttributePatch[]} patches
 */
function patchAttribute(element, patches) {
	for (const patch of patches) {
		switch (patch.type) {
			case PatchType.REMOVE_ATTRIBUTE: {
				// special case for checked, must update the element checked
				// state, because the attribute is only the initial value
				if (patch.name === "checked" && element instanceof HTMLInputElement) {
					element.checked = false;
				}

				element.removeAttribute(patch.name);
				break;
			}

			case PatchType.SET_ATTRIBUTE: {
				// special case for checked, must update the element checked
				// state, because the attribute is only the initial value
				if (patch.name === "checked" && element instanceof HTMLInputElement) {
					element.checked = true;
				}

				const value = patch.value;
				element.setAttribute(patch.name, typeof value === "string" ? value : "");
				break;
			}
		}
	}
}
