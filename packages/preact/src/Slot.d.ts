import type * as preact from "preact";

export type SlotProps = preact.RenderableProps<{ slotId: string; islandId: string }>;

// biome-ignore lint/suspicious/noExplicitAny: return type of a component
export function Slot(props: SlotProps): preact.VNode<any>;
