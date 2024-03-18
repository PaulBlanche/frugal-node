import type * as preact from "preact";

export type HydrationStrategy = "load" | "idle" | "visible" | "media-query" | "never";

export type IslandProps<PROPS> = {
	strategy?: HydrationStrategy;
	clientOnly?: boolean;
	query?: string;
	name: string;
} & (
	| {
			Component: preact.ComponentType<PROPS>;
			props: preact.RenderableProps<PROPS>;
	  }
	| {
			Component: preact.ComponentType;
	  }
);

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export function Island<PROPS>(props: IslandProps<PROPS>): preact.VNode<any>;

export let ISLAND_END: string;
