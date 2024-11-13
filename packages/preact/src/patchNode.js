/** @import * as self from "./patchNode.js" */

import { getRenderingIsland } from "./preactOptions.js";
import { isCommentNode, isElementNode } from "./utils.js";

/** @type {Map<string, Node>} */
const SLOT_FRAGMENTS = new Map();
/** @type {Map<string, { placeholder:Element, parent: Node|null}>} */
const SLOT_PLACEHOLDERS = new Map();

if (typeof document !== "undefined") {
	patchNode();
}

export function patchNode() {
	const parentNode = replaceGetter(Node.prototype, "parentNode", (parentNode) => {
		return {
			get() {
				const rendering = getRenderingIsland();

				// default parentNode if not rendering
				if (rendering === undefined) {
					return parentNode.old(this);
				}

				// default parentNode if not a slot
				const slotId = parseSlotPlaceholderId(this);
				if (slotId === undefined) {
					return parentNode.old(this);
				}

				// stored parent if slot
				const placeholder = getSlotPlaceholder(slotId);
				return /** @type {ParentNode|null} */ (placeholder.parent);
			},
		};
	});

	const nextSibling = replaceGetter(Node.prototype, "nextSibling", (nextSibling) => {
		return {
			get() {
				const rendering = getRenderingIsland();

				// default nextSibling if not rendering
				if (rendering === undefined) {
					return nextSibling.old(this);
				}

				// default nextSibling if node has no parent (outside of document or fragment)
				const parent = parentNode.new(this);
				if (parent === null) {
					return nextSibling.old(this);
				}

				const ranges = getChildRanges(rendering.id, parent);
				const realNextSibling = nextSibling.old(this);

				// if the node is among nodes including a island range and the real next sibling is the end of the island, return null
				if (ranges.island !== undefined) {
					if (realNextSibling === ranges.island.end) {
						return null;
					}
				}

				const slotId = parseSlotPlaceholderId(this);

				// if the node is among nodes including a slot range
				for (const slotRange of ranges.slots) {
					// if the real next sibling is the start of the slot, return
					// a slot placeholder
					if (realNextSibling === slotRange.start) {
						return getSlotPlaceholder(slotRange.id, this.parentNode).placeholder;
					}

					// if this is the slot placeholder, return the real next
					// sibling of the end of the range
					if (slotId !== undefined && slotId === slotRange.id) {
						return nextSibling.old(slotRange.end);
					}
				}

				return nextSibling.old(this);
			},
		};
	});

	const firstChild = replaceGetter(Node.prototype, "firstChild", (firstChild) => {
		return {
			get() {
				const rendering = getRenderingIsland();

				// default firstChild if not rendering
				if (rendering === undefined) {
					return firstChild.old(this);
				}

				// default firstChild if this does not contains island
				const ranges = getChildRanges(rendering.id, this);
				if (ranges.island === undefined) {
					return firstChild.old(this);
				}

				// first child is nextSibling of island start
				const sibling = nextSibling.old(ranges.island.start);

				// if sibling is a slot start, return the matching slot placeholder
				for (const slotRange of ranges.slots) {
					if (sibling === slotRange.start) {
						return getSlotPlaceholder(slotRange.id, this).placeholder;
					}
				}

				return sibling;
			},
		};
	});

	const _childNodes = replaceGetter(Node.prototype, "childNodes", (childNodes) => {
		return {
			get() {
				const rendering = getRenderingIsland();

				// default childNodes if not rendering
				if (rendering === undefined) {
					return childNodes.old(this);
				}

				// default childNodes if this does not contains islands or slots
				const ranges = getChildRanges(rendering.id, this);
				if (ranges.island === undefined && ranges.slots.length === 0) {
					return childNodes.old(this);
				}

				// iterate over childNodes from island.start to island.end,
				// skipping over slots (and replacing them with a slot
				// placeholder)
				/** @type {Node[]} */
				const children = [];

				const start = this.firstChild;
				const end = ranges.island?.end ?? null;

				let current = start;
				while (current !== end && current !== null) {
					let foundSlot = false;
					for (const slotRange of ranges.slots) {
						if (current === slotRange.start) {
							current = slotRange.end;
							children.push(getSlotPlaceholder(slotRange.id, this).placeholder);
							foundSlot = true;
							break;
						}
					}

					if (!foundSlot) {
						children.push(current);
					}

					current = current.nextSibling;
				}

				return /** @type {NodeListOf<ChildNode>} */ (/** @type {unknown}*/ (children));
			},
		};
	});

	const insertBefore = replaceValue(Node.prototype, "insertBefore", (insertBefore) => {
		return {
			// because `insertBefore` is generic in builtin types, there is
			// a type error here, but the implementation is ok
			value: /** @type {any} */ (newInsertBefore),
		};

		/**
		 * @param {Node} newNode
		 * @param {Node|null} referenceNode
		 * @this {HTMLElement}
		 */
		function newInsertBefore(newNode, referenceNode) {
			const rendering = getRenderingIsland();

			// default insertBefore if not rendering
			if (rendering === undefined) {
				return insertBefore.old.call(this, newNode, referenceNode);
			}

			// if the newNode is a slot placeholder, insert the stored fragment
			// instead if it exists
			let insertedNode = newNode;
			const insertedSlotId = parseSlotPlaceholderId(insertedNode);
			if (insertedSlotId !== undefined) {
				const fragment = addSlotPlaceholderToDom(insertedSlotId, this);
				if (fragment !== undefined) {
					insertedNode = fragment;
				} else {
					return insertedNode;
				}
			}

			// if reference is slot placeholder, use the slot.start as
			// reference (to insert before the range). Otherwise use
			// referenceNode with a fallback on island range end (so that in
			// island, inserting before null node insert at the end of the
			// range). If there is not island range, fallback on null
			const ranges = getChildRanges(rendering.id, this);
			let reference = referenceNode ?? ranges.island?.end ?? null;
			const referenceSlotId = parseSlotPlaceholderId(referenceNode);

			if (referenceSlotId !== undefined) {
				for (const slotRange of ranges.slots) {
					if (referenceSlotId === slotRange.id) {
						reference = slotRange.start;
					}
				}
			}

			return insertBefore.old.call(this, insertedNode, reference);
		}
	});

	const appendChild = replaceValue(Node.prototype, "appendChild", (appendChild) => {
		return {
			// because `appendChild` is generic in builtin types, there is a
			// type error here, but the implementation is ok
			value: /** @type {any} */ (newAppendChild),
		};

		/**
		 * @param {Node} child
		 * @this {HTMLElement}
		 */
		function newAppendChild(child) {
			const rendering = getRenderingIsland();

			// default appendChild if not rendering
			if (rendering === undefined) {
				return appendChild.old.call(this, child);
			}

			// if the child is a slot placeholder, append the stored fragment
			// instead if it exists
			let appendedChild = child;
			const appendedSlotId = parseSlotPlaceholderId(appendedChild);
			if (appendedSlotId !== undefined) {
				const fragment = addSlotPlaceholderToDom(appendedSlotId, this);
				if (fragment !== undefined) {
					appendedChild = fragment;
				} else {
					return appendedChild;
				}
			}

			// default appendChild if this does not contains islands
			const ranges = getChildRanges(rendering.id, this);
			if (ranges.island === undefined) {
				return appendChild.old.call(this, child);
			}

			// insert before island.end (effectively append to the end of the island range)
			return insertBefore.old.call(this, appendedChild, ranges.island.end);
		}
	});

	const _removeChild = replaceValue(Node.prototype, "removeChild", (removeChild) => {
		return {
			// because `removeChild` is generic in builtin types, there is a
			// type error here, but the implementation is ok
			value: /** @type {any} */ (newRemoveChild),
		};

		/**
		 * @param {Node} child
		 * @this {HTMLElement}
		 */
		function newRemoveChild(child) {
			const rendering = getRenderingIsland();

			// default removeChild if not rendering
			if (rendering === undefined) {
				return removeChild.old.call(this, child);
			}

			// remove the slot placeholder for each descendent slot of the
			// removed node (to trigger saving the slot in a fragment)
			const slots = getDescendantSlotRanges(child, rendering.id);
			for (const [id, slot] of slots) {
				if (slot.start.parentNode !== null) {
					slot.start.parentNode.removeChild(getSlotPlaceholder(id).placeholder);
				}
			}

			// default removeChild if this does not contains slot
			const ranges = getChildRanges(rendering.id, this);
			if (ranges.slots.length === 0) {
				return removeChild.old.call(this, child);
			}

			// default removeChild if child is not a slot
			const slotId = parseSlotPlaceholderId(child);
			if (slotId === undefined) {
				return removeChild.old.call(this, child);
			}
			const slotRange = ranges.slots.find((slot) => slot.id === slotId);
			if (slotRange === undefined) {
				return removeChild.old.call(this, child);
			}

			// move the slot range in a fragment, store the fragment
			const placeholder = getSlotPlaceholder(slotId);

			const fragment = document.createDocumentFragment();
			placeholder.parent = fragment;

			/** @type {Node|null} */
			let current = slotRange.start;
			while (current !== null && current !== slotRange.end) {
				/** @type {Node|null} */
				const sibling = nextSibling.old(current);
				appendChild.old.call(fragment, current);
				current = sibling;
			}

			appendChild.old.call(fragment, slotRange.end);

			SLOT_FRAGMENTS.set(slotRange.id, fragment);

			// change the parent of each island inside the removed slot. Each
			// island has a liste of all components that are part of the island.
			// Each of those component have a reference `__P` to the parentDom
			// (to know where to rerender if its state changes). We update this
			// `__P` reference to the fragment (the new parent), and update the
			// parent of the slots inside those islands.
			if (typeof __FRUGAL__ !== "undefined" && __FRUGAL__.islands !== undefined) {
				const rangesWithNewParent = getDirectChildIslands(fragment);
				for (const id of Object.keys(rangesWithNewParent)) {
					const instance = __FRUGAL__.islands.instances[id];

					if (instance.components) {
						for (const component of instance.components) {
							if (component.__P === instance.parent) {
								component.__P = fragment;
							}
						}
					}

					const placeholder = getSlotPlaceholder(id);
					if (placeholder.parent === instance.parent) {
						placeholder.parent = fragment;
					}

					instance.parent = fragment;
				}
			}

			return child;
		}
	});

	const _contains = replaceValue(Node.prototype, "contains", (contains) => {
		return {
			value: newContains,
		};

		/**
		 * @param {Node} child
		 * @this {HTMLElement}
		 */
		function newContains(child) {
			const rendering = getRenderingIsland();

			// default contains if not rendering
			if (rendering === undefined) {
				return contains.old.call(this, child);
			}

			// true is this is child (trivial contains)
			if (child === this) {
				return true;
			}

			// if this contains slots, return true for a slot placeholder and
			// false for any child inside the slot
			const ranges = getChildRanges(rendering.id, this);
			const slotId = parseSlotPlaceholderId(child);
			for (const slotRange of ranges.slots) {
				if (slotRange.id === slotId) {
					return true;
				}

				/** @type {Node|null} */
				let current = slotRange.start;
				while (current !== null && current !== slotRange.end) {
					if (current === child) {
						return false;
					}
					current = nextSibling.old(current);
				}
			}

			// default contains if this does not contains islands
			if (ranges.island === undefined) {
				return contains.old.call(this, child);
			}

			// return true if one childNodes contains child (using patche
			// childNodes that only returns nodes inside islands, and skipping
			// over slots)
			for (const node of this.childNodes) {
				if (node.contains(child)) {
					return true;
				}
			}

			return false;
		}
	});

	/**
	 * @param {string} id
	 * @param {Node} parent
	 * @returns {Node|undefined}
	 */
	function addSlotPlaceholderToDom(id, parent) {
		const fragment = SLOT_FRAGMENTS.get(id);
		if (fragment === undefined) {
			return;
		}

		SLOT_FRAGMENTS.delete(id);

		if (typeof __FRUGAL__ !== "undefined" && __FRUGAL__.islands !== undefined) {
			const rangesWithNewParent = getDirectChildIslands(fragment);
			for (const id of Object.keys(rangesWithNewParent)) {
				const instance = __FRUGAL__.islands.instances[id];

				if (instance.components) {
					for (const component of instance.components) {
						if (component.__P === fragment) {
							component.__P = parent;
						}
					}
				}

				const placeholder = getSlotPlaceholder(id);
				if (placeholder.parent === instance.parent) {
					placeholder.parent = fragment;
				}

				instance.parent = parent;
			}
		}

		const placeholder = getSlotPlaceholder(id);
		placeholder.parent = parent;

		return fragment;
	}

	/**
	 * @param {Node} node
	 * @returns {Record<string, self.Range>}}
	 */
	function getDirectChildIslands(node) {
		/** @type {Record<string, Partial<self.Range>>} */
		const ranges = {};

		let current = firstChild.old(node);
		while (current !== null) {
			if (isCommentNode(current)) {
				const parsed = parseRangeMarker(current.data);
				if (parsed !== undefined && parsed.type === "island") {
					ranges[parsed.id] ??= {};
					ranges[parsed.id][parsed.kind] = current;
				}
			}
			current = nextSibling.old(current);
		}

		return Object.fromEntries(
			Object.entries(ranges).filter(
				/** @return {entry is [string, self.Range]} */ (entry) => {
					return entry[1].start !== undefined && entry[1].end !== undefined;
				},
			),
		);
	}

	/**
	 * @param {string} id
	 * @param {Node} node
	 * @returns {{slots:self.SlotRange[], island?:self.IslandRange}}
	 */
	function getChildRanges(id, node) {
		/** @type {{slots:Record<string, Partial<self.SlotRange>>, island?:Partial<self.IslandRange>|undefined}} */
		const result = { slots: {} };

		let current = firstChild.old(node);
		while (current !== null) {
			if (isCommentNode(current)) {
				const parsed = parseRangeMarker(current.data);

				if (parsed !== undefined) {
					if (parsed.type === "island" && parsed.id === id) {
						result.island = result.island ?? { id: parsed.id };
						result.island[parsed.kind] = current;
					}

					if (parsed.type === "slot" && parsed.islandId === id) {
						result.slots[parsed.id] = result.slots[parsed.id] ?? {
							id: parsed.id,
							slotId: parsed.slotId,
							islandId: parsed.islandId,
						};
						result.slots[parsed.id][parsed.kind] = current;
					}
				}
			}

			current = nextSibling.old(current);
		}

		const slots = Object.values(result.slots).filter((slot) => {
			// slot with only a start or an end is not a slot
			if (
				slot.start === undefined ||
				slot.end === undefined ||
				slot.id === undefined ||
				slot.islandId === undefined ||
				slot.slotId === undefined
			) {
				return false;
			}

			return true;
		});

		// island with only a start or an end is not a slot
		if (
			result.island?.start === undefined ||
			result.island?.end === undefined ||
			result.island.id === undefined
		) {
			result.island = undefined;
		}

		return /** @type {{slots:self.SlotRange[], island?:self.IslandRange}} */ ({
			slots,
			island: result.island,
		});
	}
}

/** @type {self.parseRangeMarker} */
export function parseRangeMarker(comment) {
	if (!comment.startsWith("frugal-")) {
		return undefined;
	}

	// removes "frugal-"
	const dataWithoutPrefix = comment.slice(7);

	const firstSeparatorIndex = dataWithoutPrefix.indexOf(":");
	const secondSeparatorIndex = dataWithoutPrefix.indexOf(":", firstSeparatorIndex + 1);

	if (firstSeparatorIndex === -1 && secondSeparatorIndex === -1) {
		return undefined;
	}

	const type = dataWithoutPrefix.slice(0, firstSeparatorIndex);
	const kind = dataWithoutPrefix.slice(firstSeparatorIndex + 1, secondSeparatorIndex);
	const id = dataWithoutPrefix.slice(secondSeparatorIndex + 1);

	if (kind !== "start" && kind !== "end") {
		return undefined;
	}

	if (type !== "island" && type !== "slot") {
		return undefined;
	}

	if (type === "island") {
		return { type, kind, id };
	}

	const separatorIndex = id.indexOf(":");
	const islandId = id.slice(0, separatorIndex);
	const slotId = id.slice(separatorIndex + 1);
	return { type, kind, id: `${islandId}-${slotId}`, slotId, islandId };
}

/**
 * @param {string} id
 * @param {Node|null} [parent]
 */
function getSlotPlaceholder(id, parent) {
	if (!SLOT_PLACEHOLDERS.has(id)) {
		SLOT_PLACEHOLDERS.set(id, {
			parent: null,
			placeholder: document.createElement(`frugal-slot-${id}`),
		});
	}

	const entry = /** @type {{ placeholder:Element, parent: Node|null }}*/ (
		SLOT_PLACEHOLDERS.get(id)
	);

	if (parent !== undefined) {
		entry.parent = parent;
	}

	return entry;
}

/**
 * @template OBJECT
 * @template {keyof OBJECT} PROPERTY
 * @param {OBJECT} object
 * @param {PROPERTY} property
 * @param {(old:{ old(thisArg: unknown): OBJECT[PROPERTY] }) => { get(): OBJECT[PROPERTY] } & ThisType<OBJECT>} descriptorMaker
 * @returns {{ old:(thisArg:unknown) => OBJECT[PROPERTY], new:(thisArg:unknown)=> OBJECT[PROPERTY]}}
 */
function replaceGetter(object, property, descriptorMaker) {
	const oldDescriptor = Object.getOwnPropertyDescriptor(object, property);

	const oldGet = oldDescriptor?.get;

	if (oldGet === undefined) {
		throw new Error(`Object has no getter for property "${String(property)}"`);
	}

	const newGet = descriptorMaker({ old: (thisArg) => oldGet.call(thisArg) }).get;

	Object.defineProperty(object, property, { ...oldDescriptor, get: newGet });

	return {
		/**
		 * @param {unknown} thisArg
		 */
		old: (thisArg) => {
			return oldGet.call(thisArg);
		},
		/**
		 * @param {unknown} thisArg
		 */
		new: (thisArg) => {
			return newGet.call(thisArg);
		},
	};
}

/**
 * @template OBJECT
 * @template {keyof OBJECT} PROPERTY
 * @param {OBJECT} object
 * @param {PROPERTY} property
 * @param {(old:{ old: OBJECT[PROPERTY] }) => { value: OBJECT[PROPERTY] } & ThisType<OBJECT>} descriptorMaker
 * @returns {{ old: OBJECT[PROPERTY], new: OBJECT[PROPERTY]}}
 */
function replaceValue(object, property, descriptorMaker) {
	const oldDescriptor = Object.getOwnPropertyDescriptor(object, property);

	const oldValue = oldDescriptor?.value;

	if (oldValue === undefined) {
		throw new Error(`Object has no value for property "${String(property)}"`);
	}

	const newValue = descriptorMaker({ old: oldValue }).value;

	Object.defineProperty(object, property, { ...oldDescriptor, value: newValue });

	return {
		/**
		 * @param {unknown} thisArg
		 */
		old: oldValue,
		/**
		 * @param {unknown} thisArg
		 */
		new: newValue,
	};
}

/**
 * @param {Node|null} node
 * @returns {string|undefined}
 */
function parseSlotPlaceholderId(node) {
	if (node === null || node === undefined) {
		return undefined;
	}

	if (isElementNode(node) && node.localName.startsWith("frugal-slot-")) {
		return node.localName.slice(12);
	}

	return undefined;
}

/**
 * @param {Node} node
 * @param {string} id
 * @returns {[string, self.Range][]}
 */
function getDescendantSlotRanges(node, id) {
	/** @type {Record<string, Partial<self.Range>>} */
	const ranges = {};

	const iterator = document.createNodeIterator(node, NodeFilter.SHOW_COMMENT);

	let current = iterator.nextNode();
	while (current !== null) {
		if (isCommentNode(current)) {
			const parsed = parseRangeMarker(current.data);
			if (parsed !== undefined && parsed.type === "slot" && parsed.islandId === id) {
				ranges[parsed.id] = ranges[parsed.id] ?? {};
				ranges[parsed.id][parsed.kind] = current;
			}
		}
		current = iterator.nextNode();
	}

	const slots = Object.entries(ranges).filter(([_, range]) => {
		return range.start !== undefined && range.end !== undefined;
	});

	return /** @type {[id, self.Range][]}*/ (slots);
}
