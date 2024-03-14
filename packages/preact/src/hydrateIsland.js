import * as preact from "preact";
import { Hydratable } from "./Hydratable.js";
import { ISLAND_END } from "./Island.js";
import { createRootFragment } from "./createRootFragment.js";

/** @type {import('./hydrateIsland.ts').hydrateIsland} */
export function hydrateIsland(start, App) {
	/** @type {preact.RenderableProps<preact.ComponentProps<typeof App>>} */
	const props = start.textContent ? JSON.parse(start.textContent ?? {}) : {};

	const children = getComponentRange(start);

	if (start.parentNode === null) {
		return;
	}

	const root = createRootFragment(start.parentNode, children);

	// hydrate the "dom range" of the island
	preact.hydrate(
		// @ts-expect-error: App generic PROPS type wrongly infered to `unknown`
		preact.h(Hydratable, { App, props }),
		root,
	);

	window.FRUGAL_SESSION_INSTANCE?.addEventListener("unmount", unmount);

	start.dataset["hydrated"] = "";

	function unmount() {
		preact.render(null, root);
		window.FRUGAL_SESSION_INSTANCE?.removeEventListener("unmount", unmount);
	}
}

/**
 * @param {HTMLScriptElement} start
 * @returns {Node[]}
 */
function getComponentRange(start) {
	/** @type {Node[]} */
	const children = [];
	let node = start.nextSibling;
	while (node !== null) {
		if (isCommentNode(node)) {
			const match = node.data.match(ISLAND_END);
			if (match !== null) {
				break;
			}
		}
		children.push(node);
		node = node.nextSibling;
	}

	// we need at least one node in the range for hydration, so we create an
	// empty one
	if (children.length === 0) {
		const emptyNode = document.createElement("span");
		start.after(emptyNode);
		return [emptyNode];
	}

	return children;
}

/**
 *
 * @param {Node} node
 * @returns {node is Comment}
 */
function isCommentNode(node) {
	return node.nodeType === Node.COMMENT_NODE;
}
