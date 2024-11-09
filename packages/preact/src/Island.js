/** @import * as self from "./Island.js" */
/** @import { ServerData } from "@frugal-node/core/utils/serverData" */

import { serialize } from "@frugal-node/core/utils/serverData";
import * as preact from "preact";
import * as hooks from "preact/hooks";
import { Head, HeadProvider } from "./Head.js";
import { ClientSidePageDataProvider } from "./PageDataProvider.js";
import { Slot } from "./Slot.js";
import { environmentContext } from "./environmentContext.js";

/** @type {self.Island} */
export function Island(props) {
	const id = hooks.useId().toLowerCase();

	return preact.h(
		InternalIsland,
		/** @type {any} */ ({ ...props, id: props.id ?? id }),
		props.children,
	);
}

/** @type {self.InternalIsland} */
export function InternalIsland(props) {
	const environment = hooks.useContext(environmentContext);

	// if we are in an island environment (server side or client side), island
	// simply render the component
	if (environment.type === "island") {
		return "props" in props
			? preact.h(
					props.Component,
					{
						...props.props,
					},
					props.children,
				)
			: preact.h(props.Component, {}, props.children);
	}

	// server side and not in an island, render an island. Two comments marks
	// the dom range for the island. Props are serialized in a script in the
	// head. Children are wrapped in a `Slot`
	if (typeof document === "undefined") {
		/** @type {ServerData} */
		const serializableProps = "props" in props ? removeVNodes(props.props) : null;

		const script = `window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};${serializableProps ? `window.__FRUGAL__.islands.instances["${props.id}"] = { props: ${serializeProps(serializableProps)}, name: "${props.name}" }` : ""};window.__FRUGAL__.islands.names["${props.name}"] = window.__FRUGAL__.islands.names["${props.name}"] || [];window.__FRUGAL__.islands.names["${props.name}"].push("${props.id}");`;

		return preact.h(
			environmentContext.Provider,
			{ value: { type: "island" } },
			preact.h(
				Head,
				{},
				preact.h("script", {
					["data-priority"]: -1,
					dangerouslySetInnerHTML: { __html: script },
				}),
			),
			preact.h(`!--frugal-island:start:${props.id}--`, null),
			!props.clientOnly &&
				("props" in props
					? preact.h(
							props.Component,
							wrapVNodesInSlots(props.id, props.props),
							preact.h(
								Slot,
								{ islandId: props.id, slotId: "children" },
								props.children,
							),
						)
					: preact.h(
							props.Component,
							{},
							preact.h(
								Slot,
								{ islandId: props.id, slotId: "children" },
								props.children,
							),
						)),
			// hack to render comment, works only with render-to-string
			preact.h(`!--frugal-island:end:${props.id}--`, null),
		);
	}

	return preact.h(
		ClientSidePageDataProvider,
		{},
		preact.h(
			HeadProvider,
			{
				onHeadUpdate: (nextHead) => {
					preact.render(nextHead, document.head);
				},
			},
			preact.h(
				environmentContext.Provider,
				{
					value: { type: "island" },
				},
				"props" in props
					? preact.h(
							props.Component,
							wrapVNodesInSlots(props.id, props.props),
							preact.h(Slot, { islandId: props.id, slotId: "children" }),
						)
					: preact.h(
							props.Component,
							{},
							preact.h(Slot, { islandId: props.id, slotId: "children" }),
						),
			),
		),
	);
}

/**
 * @param {ServerData} props
 * @returns {string}
 */
function serializeProps(props) {
	try {
		return serialize(props);
	} catch (error) {
		throw Error("props passed to the island are not serializable");
	}
}

/**
 * @param {string} id
 * @param {any} props
 * @returns {any}
 */
function wrapVNodesInSlots(id, props, key = "root") {
	if (preact.isValidElement(props)) {
		return preact.h(Slot, { slotId: key, islandId: id }, props);
	}

	if (
		typeof props === "object" &&
		props !== null &&
		"type" in props &&
		props.type === "frugal-slot"
	) {
		return preact.h(Slot, { slotId: key, islandId: id });
	}

	if (Array.isArray(props)) {
		return props.map((prop, index) => {
			return wrapVNodesInSlots(id, prop, `${key}.${index}`);
		});
	}

	if (typeof props === "object" && props !== null) {
		return Object.fromEntries(
			Object.entries(props).map(([name, prop]) => {
				return [name, wrapVNodesInSlots(id, prop, `${key}.${name}`)];
			}),
		);
	}

	if (props instanceof Set) {
		const cleanSet = new Set();
		let i = 0;
		for (const prop of props.values()) {
			cleanSet.add(wrapVNodesInSlots(id, prop, `${key}.${i++}`));
		}
		return cleanSet;
	}

	if (props instanceof Map) {
		const cleanMap = new Map();
		for (const [name, prop] of props.entries()) {
			cleanMap.set(name, wrapVNodesInSlots(id, prop, `${key}.${name}`));
		}
		return cleanMap;
	}

	return props;
}

/**
 * @param {any} props
 * @return {ServerData}
 */
function removeVNodes(props) {
	if (preact.isValidElement(props)) {
		return { type: "frugal-slot" };
	}

	if (Array.isArray(props)) {
		return props.map((prop) => {
			return removeVNodes(prop);
		});
	}

	if (typeof props === "object" && props !== null) {
		return Object.fromEntries(
			Object.entries(props).map(([name, prop]) => {
				return [name, removeVNodes(prop)];
			}),
		);
	}

	if (props instanceof Set) {
		const cleanSet = new Set();
		for (const prop of props.values()) {
			cleanSet.add(removeVNodes(prop));
		}
		return cleanSet;
	}

	if (props instanceof Map) {
		const cleanMap = new Map();
		for (const [name, prop] of props.entries()) {
			cleanMap.set(name, removeVNodes(prop));
		}
		return cleanMap;
	}

	return props;
}
