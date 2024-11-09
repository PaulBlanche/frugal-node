import type * as preact from "preact";

export type SlotProps = preact.RenderableProps<{ slotId: string; islandId: string }>;

export function Slot(props: SlotProps): preact.VNode<any>;
