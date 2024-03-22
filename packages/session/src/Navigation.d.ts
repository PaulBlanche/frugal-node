import type { NavigationConfig } from "./Page.js";

declare global {
	interface Document {
		startViewTransition?(fn: () => void): {
			finished: Promise<boolean>;
		};
	}
}

export type GlobalNavigationEvent = { type: "start" | "end" } & NavigationEvent;

export type NavigationEndpoint = {
	__frugal_history_id: string;
	url: string;
	data: unknown;
};

export type NavigationEvent =
	| {
			cause: "popstate" | "push" | "replace";
			from: NavigationEndpoint;
			to: NavigationEndpoint;
	  }
	| {
			cause: "pagehide";
			from: NavigationEndpoint;
			to?: undefined;
	  }
	| {
			cause: "pageshow";
			from?: undefined;
			to: NavigationEndpoint;
	  };

export type FallbackType = "native" | "throw" | "none";

export type NavigationEvents = {
	mount: { type: "mount" };
	beforerender: { type: "beforerender" };
	unmount: { type: "unmount" };
};

export type NavigationListener<TYPE extends keyof NavigationEvents> = (
	event: NavigationEvents[TYPE],
) => void | Promise<void>;

export interface Navigation {
	run(
		setPageScroll: (historyState: NavigationEndpoint) => void,
		init?: RequestInit,
	): Promise<boolean>;
	addEventListener<TYPE extends keyof NavigationEvents>(
		type: TYPE,
		listener: NavigationListener<TYPE>,
	): void;
}

interface NavigationMaker {
	create(
		event: NavigationEvent,
		config: {
			navigationConfig: NavigationConfig;
			fallback: FallbackType;
			scrollRestoration: "auto" | "manual";
			useTransition: boolean;
		},
	): Navigation;
}

export let Navigation: NavigationMaker;
