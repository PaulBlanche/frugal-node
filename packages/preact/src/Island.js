import * as preact from "preact";
import * as hooks from "preact/hooks";

export const ISLAND_END = "frugal-island-end";

const islandContext = preact.createContext(false);

/** @type {import('./Island.ts').Island} */
export function Island({ name, clientOnly = false, strategy, query, ...rest }) {
	const isInIsland = hooks.useContext(islandContext);

	const Component =
		"props" in rest ? preact.h(rest.Component, rest.props) : preact.h(rest.Component, {});

	// client side or inside an island, simply render the component
	if (typeof document !== "undefined" || isInIsland) {
		return Component;
	}

	// server side and not in an island, render an island. The `script` element
	// marks the start of the island "dom range". The end comment marks the end
	// of the range. Those two nodes will be used by the hydration to avoid
	// forcing a root node around an island
	return preact.h(
		islandContext.Provider,
		{ value: true },
		preact.h("script", {
			"data-hydratable": name,
			"data-hydration-strategy": strategy ?? "load",
			"data-hydration-query": query,
			type: "application/json",
			dangerouslySetInnerHTML:
				"props" in rest ? { __html: JSON.stringify(rest.props) } : undefined,
		}),
		!clientOnly && Component,
		// hack to render comment, works only with render-to-string
		preact.h(`!--${ISLAND_END}--`, null),
	);
}
