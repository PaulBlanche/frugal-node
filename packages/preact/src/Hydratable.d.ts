import * as preact from "preact";

export type App<PROPS> = (props: PROPS) => preact.VNode<any>;

export type HydratableProps<PROPS> = {
	App: App<PROPS>;
	props: preact.RenderableProps<PROPS>;
};

export function Hydratable<PROPS>(props: HydratableProps<PROPS>): preact.VNode<any>;
