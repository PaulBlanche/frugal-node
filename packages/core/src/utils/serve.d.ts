import type * as http from "node:http";

export type HandlerInfo = {
	hostname: string;
	port: string;
	identifier: string;
};

export type EventStreamResponse = Response & { close: () => void };

export type Handler = (
	request: Request,
	info: HandlerInfo,
) => Response | EventStreamResponse | Promise<Response | EventStreamResponse>;

export type ServeOptions = {
	signal?: AbortSignal;
	port?: number;
	hostname?: string;
	secure?: boolean;
} & ({ cert?: undefined; key?: undefined } | { cert: string; key: string });

export function serve(
	handler: Handler,
	options?: ServeOptions,
): { listening: Promise<{ hostname: string; port: number }>; finished: Promise<void> };

export function nativeHandler(handler: Handler, secure?: boolean): http.RequestListener;
