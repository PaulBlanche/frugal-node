import type * as http from "node:http";
import type { log } from "../utils/log.js";
import type * as server from "../utils/serve.js";

export type ServerContext = { info: server.HandlerInfo; log: typeof log; secure: boolean };

type Handler = (
	request: Request,
	context: ServerContext,
) => Response | server.EventStreamResponse | Promise<Response | server.EventStreamResponse>;

export interface Server {
	nativeHandler(secure?: boolean): http.RequestListener;
	handler(secure?: boolean): server.Handler;
	serve(config?: server.ServeOptions & { secure?: boolean }): {
		listening: Promise<{ hostname: string; port: number }>;
		finished: Promise<void>;
	};
}

interface ServerCreator {
	create(handler: Handler, config?: { logScope?: string }): Server;
}

export let Server: ServerCreator;
