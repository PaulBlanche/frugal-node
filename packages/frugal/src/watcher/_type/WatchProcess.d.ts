export type EventType = "suspend" | "reload";

export type Listener = (type: EventType) => void;
