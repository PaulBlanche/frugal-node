/** @import * as self from "./preactOptions.js" */
/** @import { InternalIslandProps } from "./Island.js" */
/** @import { SlotProps } from "./Slot.js" */

import { InternalIsland } from "./Island.js";
import { Slot } from "./Slot.js";
import { HOOK, hook } from "./hook.js";

const hasRendered = new Set();
/** @type {Map<string, { init:string[], current:string[]}>} */
const ISLAND_SLOT_COUNT = new Map();

/** @type {{ id: string, node:preact.VNode }|undefined} */
let RENDERING_ISLAND = undefined;

/** @type {self.setRenderingIsland} */
export function setRenderingIsland(id, node) {
	RENDERING_ISLAND = { id, node };
}

/** @type {self.getRenderingIsland} */
export function getRenderingIsland() {
	return RENDERING_ISLAND;
}

/** @type {self.resetRenderingIsland} */
export function resetRenderingIsland() {
	RENDERING_ISLAND = undefined;
}

if (typeof document !== "undefined") {
	hook(HOOK.DIFF, (old, node) => {
		const renderingIsland = getRenderingIsland();

		// if we are not currently diffing inside an island, we should be about
		// to start diffing the first component of an island "pass". Since it
		// could be only a rerender of a child component of the island, we go up
		// the parent chain until we find the parent `InternalIsland` component
		// to get the id of the island. We also save the node that started the
		// island pass (to know when the pass stops in the DIFFED hook)
		if (renderingIsland === undefined) {
			let current = node;
			while (current !== null) {
				if (isInternalIsland(current)) {
					setRenderingIsland(current.props.id, node);
					const count = ISLAND_SLOT_COUNT.get(current.props.id);
					if (count === undefined) {
						ISLAND_SLOT_COUNT.set(current.props.id, { init: [], current: [] });
					} else {
						count.current = [];
					}
				}
				current = current.__;
			}

			//TODO: throw an error if a island was not found ?
		}

		// if we are rendering a slot in an island, the island is marked as
		// slotfull. If the island was already marked as slotless, it means the
		// children of the island were not rendered during the first render
		// (that's what slotless means). So the children is not part of the
		// initial DOM. So the application can't "know" what should go in the
		// slot on subsequent render. So we error
		if (isSlot(node) && renderingIsland !== undefined) {
			if (hasRendered.has(renderingIsland.id)) {
				const count = ISLAND_SLOT_COUNT.get(node.props.islandId);
				if (count === undefined) {
					ISLAND_SLOT_COUNT.set(node.props.islandId, {
						init: [],
						current: [node.props.slotId],
					});
				} else {
					count.current.push(node.props.slotId);
				}
			} else {
				const count = ISLAND_SLOT_COUNT.get(node.props.islandId);
				if (count === undefined) {
					ISLAND_SLOT_COUNT.set(node.props.islandId, {
						init: [node.props.slotId],
						current: [node.props.slotId],
					});
				} else {
					count.init.push(node.props.slotId);
					count.current.push(node.props.slotId);
				}
			}
		}

		old(node);
	});

	hook(HOOK.DIFFED, (old, node) => {
		const renderingIsland = getRenderingIsland();

		// when the node that started the pass is "diffed", the pass on the
		// island is done, we reset
		if (node === renderingIsland?.node) {
			resetRenderingIsland();
			hasRendered.add(renderingIsland.id);

			const count = ISLAND_SLOT_COUNT.get(renderingIsland.id);
			if (
				window.__FRUGAL__.islands &&
				count !== undefined &&
				count.current.some((slot) => !count.init.includes(slot))
			) {
				const instance = window.__FRUGAL__.islands.instances[renderingIsland.id];
				const extraSlots = count.current.filter((id) => !count.init.includes(id));
				throw new Error(
					`Some extra slots "${extraSlots.join(",")}" not present in first render of island "${instance.name}" with id "${renderingIsland.id}" were rendered on subsequent render. All slots must be rendered during first render.`,
				);
			}
		}

		if (
			window.__FRUGAL__.islands !== undefined &&
			renderingIsland !== undefined &&
			node.__c !== null
		) {
			const instance = window.__FRUGAL__.islands.instances[renderingIsland.id];
			instance.components = instance.components ?? new Set();
			instance.components.add(node.__c);
		}

		old(node);
	});

	hook(HOOK.UNMOUNT, (old, node) => {
		const renderingIsland = getRenderingIsland();

		if (
			window.__FRUGAL__.islands !== undefined &&
			renderingIsland !== undefined &&
			node.__c !== null
		) {
			const instance = window.__FRUGAL__.islands.instances[renderingIsland.id];
			instance.components = instance.components ?? new Set();
			instance.components.delete(node.__c);
		}

		old(node);
	});
}

/**
 * @param {preact.VNode<any>} node
 * @returns {node is preact.VNode<InternalIslandProps>}
 */
function isInternalIsland(node) {
	return node.type === InternalIsland;
}

/**
 * @param {preact.VNode<any>} node
 * @returns {node is preact.VNode<SlotProps>}
 */
function isSlot(node) {
	return node.type === Slot;
}
