import type { NodePatch } from "./types.js";

export type PatchQueueItem = {
	patch: NodePatch;
	parent: Node;
	child?: Node;
};

export function patch(patch: NodePatch, target: Node): void;
