import type * as preact from "preact";

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export type App<PROPS> = (props: PROPS) => preact.VNode<any>;

export type HydratableProps<PROPS> = {
	App: App<PROPS>;
	props: preact.RenderableProps<PROPS>;
};

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export function Hydratable<PROPS>(props: HydratableProps<PROPS>): preact.VNode<any>;
