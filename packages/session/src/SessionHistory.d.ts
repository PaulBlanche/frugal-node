import type { NavigationConfig } from "./Page.js";

type SessionHistoryEvents = {
	mount: { type: "mount" };
	unmount: { type: "unmount" };
};

type SessionHistoryListener<TYPE extends keyof SessionHistoryEvents> = (
	event: SessionHistoryEvents[TYPE],
) => void | Promise<void>;

export type SessionHistoryOptions = {
	scrollRestoration?: "auto" | "manual";
	enableViewTransition?: boolean;
	navigationConfig: NavigationConfig;
};

export interface SessionHistory {
	observe(): void;
	disconnect(): void;
	navigate(
		url: string | URL,
		options?: {
			state?: unknown;
			replace?: boolean;
			init?: RequestInit;
			fallbackType?: "native" | "throw" | "none";
		},
	): Promise<boolean>;
	scrollRestoration: "auto" | "manual";
	addEventListener<TYPE extends keyof SessionHistoryEvents>(
		type: TYPE,
		listener: SessionHistoryListener<TYPE>,
	): void;
	removeEventListener<TYPE extends keyof SessionHistoryEvents>(
		type: TYPE,
		listener: SessionHistoryListener<TYPE>,
	): void;
}

interface SessionHistorySingleton extends SessionHistory {
	init(options: SessionHistoryOptions): void;
}

export let SessionHistory: SessionHistorySingleton;
