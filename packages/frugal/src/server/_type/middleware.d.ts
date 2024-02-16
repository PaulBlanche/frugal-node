export type Next<CONTEXT> = (context: CONTEXT) => Promise<Response>;

export type Middleware<CONTEXT> = (
	context: CONTEXT,
	next: Next<CONTEXT>,
) => Promise<Response> | Response;
