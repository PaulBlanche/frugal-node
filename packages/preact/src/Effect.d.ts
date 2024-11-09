import type * as preact from "preact";

export type Manager = { update(state: preact.VNode[]): void; instanceStack: Set<Effect> };

export type SideEffectProps = {
	reduceComponentsToState: (components: Effect[]) => preact.VNode[];
	manager: Manager;
};

export class Effect extends preact.Component<SideEffectProps> {
	render(): null;
}
