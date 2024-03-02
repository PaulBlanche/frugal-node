export type EventType = "suspend" | "reload";

export type Listener = (type: EventType) => void;

export type WatchProcess = {
	addEventListener(listener: Listener): void;

	spawn(): Promise<void>;

	kill(): Promise<void>;
};

export function create(): WatchProcess;
