export type EventType = "build:end" | "build:start";

export type Listener = (type: EventType) => void;

export type WatchProcess = {
	addEventListener(listener: Listener): void;

	spawn(config: { entrypoint: string; args: string[]; watch?: string[] }): Promise<void>;

	kill(): Promise<void>;
};

type WatchProcessCreator = {
	create(): WatchProcess;
};

export let WatchProcess: WatchProcessCreator;
