import type { NavigationConfig } from "./Page.js";
import type { PrefetchConfig } from "./Prefetcher.js";

declare global {
	var FRUGAL_SESSION_INSTANCE: Session | undefined;

	interface WindowEventMap {
		"frugal:session": CustomEvent<SessionSingleton>;
	}
}

type SessionConfig = {
	navigation?: Partial<
		NavigationConfig & { scrollRestoration: "auto" | "manual"; enableViewTransition: boolean }
	>;
	prefetch?: Partial<PrefetchConfig>;
};

type SessionEvents = {
	mount: { type: "mount" };
	unmount: { type: "unmount" };
};

type SessionListener<TYPE extends keyof SessionEvents> = (
	event: SessionEvents[TYPE],
) => void | Promise<void>;

export interface Session {
	observe(): void;
	disconnect(): void;
	navigate(url: string | URL, options?: { state?: unknown; replace?: boolean }): Promise<boolean>;
	submit(form: HTMLFormElement): Promise<void>;
	addEventListener<TYPE extends keyof SessionEvents>(
		type: TYPE,
		listener: SessionListener<TYPE>,
	): void;
	removeEventListener<TYPE extends keyof SessionEvents>(
		type: TYPE,
		listener: SessionListener<TYPE>,
	): void;
}

interface SessionSingleton extends Session {
	init(options?: SessionConfig): void;
}

export let Session: SessionSingleton;
