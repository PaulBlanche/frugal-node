import type { BaseContext } from "../context.ts";
import type { Next } from "../middleware.ts";

export function etag<CONTEXT extends BaseContext>(
	context: CONTEXT,
	next: Next<CONTEXT>,
): Promise<Response>;
