import * as preact from "preact";

type HeadProviderProps = {
	onHeadUpdate: (head: preact.VNode[]) => void;
};

export function HeadProvider(props: preact.RenderableProps<HeadProviderProps>): preact.VNode<any>;

export function Head(props: preact.RenderableProps<{}>): preact.VNode<any>;
