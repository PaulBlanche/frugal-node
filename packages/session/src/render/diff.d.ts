import type { NodePatch } from "./types.js";

type DiffQueueItem = [patchList: NodePatch[], actual?: Node | null, target?: Node | null];

type VisitResult =
	| [patch: NodePatch]
	| [patch: NodePatch, items: DiffQueueItem[], inhibit?: boolean];

export function diff(actual: Node, target: Node): NodePatch;
