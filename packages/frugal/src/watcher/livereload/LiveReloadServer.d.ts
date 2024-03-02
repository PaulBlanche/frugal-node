import { ServeOptions } from "../../utils/serve.js";

type Event = { type: "suspend" | "reload" | "connected" };

export interface LiveReloadServer {
	dispatch(event: Event): void;

	serve(options: ServeOptions): Promise<void>;
}

interface LiveReloadServerMaker {
	create(): LiveReloadServer;
}

export const LiveReloadServer: LiveReloadServerMaker;
