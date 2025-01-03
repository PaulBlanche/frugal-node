import type { ServeOptions } from "../../utils/serve.js";

type Event = { type: "suspend" | "reload" | "connected" };

export interface LiveReloadServer {
	dispatch(event: Event): void;

	serve(options: ServeOptions): {
		listening: Promise<{ hostname: string; port: number }>;
		finished: Promise<void>;
	};
}

interface LiveReloadServerCreator {
	create(): LiveReloadServer;
}

export let LiveReloadServer: LiveReloadServerCreator;
