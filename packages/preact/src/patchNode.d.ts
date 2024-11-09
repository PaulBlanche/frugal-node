export type Range = { start: Comment; end: Comment };

export type IslandRange = { start: Comment; end: Comment; id: string };

export type SlotRange = {
	start: Comment;
	end: Comment;
	id: string;
	islandId: string;
	slotId: string;
};

type IslandRangeMarker = { type: "island"; kind: "start" | "end"; id: string };

type SlotRangeMarker = {
	type: "slot";
	kind: "start" | "end";
	id: string;
	islandId: string;
	slotId: string;
};

export function parseRangeMarker(comment: string): SlotRangeMarker | IslandRangeMarker | undefined;

export function patchNode(): void;
