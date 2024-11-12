/** @import * as self from "./hydrate.js" */
/** @import { Range } from "./patchNode.js" */

import * as preact from "preact";
//import "preact/debug";
import { Island } from "./Island.js";
import { parseRangeMarker } from "./patchNode.js";
import { setRenderingIsland } from "./preactOptions.js";
import { isCommentNode } from "./utils.js";

/** @type {Record<DocumentReadyState, number>} */
const READYSTATE_ORDER = {
	loading: 0,
	interactive: 1,
	complete: 2,
};

/** @type {self.hydrate} */
export function hydrate(name, getComponent) {
	// if page is not yet complete, hydrate on readyState complete. Otherwise,
	// hydrate
	if (READYSTATE_ORDER[document.readyState] <= READYSTATE_ORDER["complete"]) {
		document.addEventListener("readystatechange", () => {
			if (document.readyState === "complete") {
				doHydrate(name, getComponent);
			}
		});
	} else {
		doHydrate(name, getComponent);
	}

	// if session is not yet initialised, wait for init to bind hydration to
	// "mount" event (when target html is fully mounted). Otherwise bind to the
	// "mount" event directly
	if (window.FRUGAL_SESSION_INSTANCE === undefined) {
		addEventListener(
			"frugal:session",
			(event) => {
				event.detail.addEventListener("mount", () => doHydrate(name, getComponent));
			},
			{ once: true },
		);
	} else {
		window.FRUGAL_SESSION_INSTANCE?.addEventListener("mount", () =>
			doHydrate(name, getComponent),
		);
	}
}

/**
 * @param {string} name
 * @param {() => Promise<preact.ComponentType<any>>|preact.ComponentType<any>} getComponent
 */
async function doHydrate(name, getComponent) {
	if (window.__FRUGAL__.islands === undefined) {
		return;
	}

	const Component = await getComponent();

	const ids = window.__FRUGAL__.islands.names[name];

	if (ids === undefined) {
		return;
	}

	populateRanges(name, ids);

	for (const id of ids) {
		const props = window.__FRUGAL__.islands.instances[id].props;
		const parent = window.__FRUGAL__.islands.instances[id].parent;
		if (parent === undefined) {
			throw Error(`No markup found for island "${id}"`);
		}

		const node =
			props === undefined
				? preact.h(Island, { name, Component, id })
				: preact.h(Island, { name, props, Component, id });

		setRenderingIsland(id, node);

		preact.hydrate(node, parent);
	}
}

/**
 * @param {string} name
 * @param {string[]} ids
 * @returns {void}
 */
function populateRanges(name, ids) {
	if (window.__FRUGAL__.islands === undefined) {
		return;
	}
	const ranges = getIslandRanges(ids);

	for (const [id, range] of Object.entries(ranges)) {
		const parent = range.start.parentNode;
		if (parent !== null) {
			window.__FRUGAL__.islands.instances[id] ??= {
				name,
				props: undefined,
				components: new Set(),
			};
			window.__FRUGAL__.islands.instances[id].parent = parent;
		}
	}
}

/**
 * @param {string[]} ids
 * @returns {Record<string, Range>}
 */
function getIslandRanges(ids) {
	/** @type {Record<string, Partial<Range>>} */
	const ranges = {};

	const iterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT);

	let current = iterator.nextNode();
	while (current !== null) {
		if (isCommentNode(current)) {
			const parsed = parseRangeMarker(current.data);
			if (parsed !== undefined && parsed.type === "island" && ids.includes(parsed.id)) {
				ranges[parsed.id] ??= {};
				ranges[parsed.id][parsed.kind] = current;
			}
		}
		current = iterator.nextNode();
	}

	return Object.fromEntries(
		Object.entries(ranges).filter(
			/** @return {entry is [string, Range]} */ (entry) => {
				return entry[1].start !== undefined && entry[1].end !== undefined;
			},
		),
	);
}
