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
	onListen?: (params: { hostname: string; port: number }) => void;
} & ({ cert?: undefined; key?: undefined } | { cert: string; key: string });
