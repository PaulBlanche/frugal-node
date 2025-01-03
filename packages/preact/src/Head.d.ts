import type * as preact from "preact";
import type { Manager } from "./Effect.js";

type HeadProviderProps = {
	onHeadUpdate: (head: preact.VNode[]) => void;
};

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export function HeadProvider(props: preact.RenderableProps<HeadProviderProps>): preact.VNode<any>;

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export function Head(props: { children?: preact.ComponentChildren }): preact.VNode<any>;

export let headManagerContext: preact.Context<Manager | undefined>;
