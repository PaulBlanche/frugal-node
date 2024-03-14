import * as preact from "preact";

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

export function Island<PROPS>(props: IslandProps<PROPS>): preact.VNode<any>;

export const ISLAND_END: string;
