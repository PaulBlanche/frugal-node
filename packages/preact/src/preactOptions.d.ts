import type * as preact from "preact";

declare module "preact" {
	interface VNode {
		// component instance
		__c: preact.ComponentClass & {
			// parentDom of the component instance
			__P: Node;
		};
		// parent vnode
		__: VNode;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: type of generic VNode
export function setRenderingIsland(id: string, node: preact.VNode<any>): void;

export function getRenderingIsland(): { id: string; node: preact.VNode } | undefined;

export function resetRenderingIsland(): void;
