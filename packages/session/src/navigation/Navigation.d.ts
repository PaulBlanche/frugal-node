import type { NavigationConfig } from "../page/Page.js";

declare global {
	interface Document {
		startViewTransition(updateCallback: () => Promise<void> | void): ViewTransition;
	}

	interface CSSStyleDeclaration {
		viewTransitionName: string;
	}
}

interface ViewTransition {
	readonly ready: Promise<undefined>;
	readonly finished: Promise<undefined>;
	readonly updateCallbackDone: Promise<undefined>;
	skipTransition(): void;
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

interface NavigationCreator {
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

export let Navigation: NavigationCreator;
