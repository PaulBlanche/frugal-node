import type { ServerData } from "@frugal-node/core/utils/serverData";
import type * as preact from "preact";

type BaseProps = Record<string, ServerData | preact.ComponentChildren>;

type BaseIslandProps<PROPS extends BaseProps = BaseProps> = {
	name: string;
	clientOnly?: boolean;
} & (
	| { props: PROPS; Component: preact.ComponentType<PROPS> }
	| { Component: preact.ComponentType<preact.RenderableProps<{}>> }
);

export type IslandProps<PROPS extends BaseProps = BaseProps> = preact.RenderableProps<
	{ id?: string } & BaseIslandProps<PROPS>
>;

export type InternalIslandProps<PROPS extends BaseProps = BaseProps> = preact.RenderableProps<
	{ id: string } & BaseIslandProps<PROPS>
>;

export function InternalIsland<PROPS extends BaseProps = BaseProps>(
	props: InternalIslandProps<PROPS>,
): preact.VNode<any>;

export function Island<PROPS extends BaseProps = BaseProps>(
	props: IslandProps<PROPS>,
): preact.VNode<any>;
