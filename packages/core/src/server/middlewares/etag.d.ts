import type { BaseContext } from "../context.js";
import type { Next } from "../middleware.js";

export function etag<CONTEXT extends BaseContext>(
	context: CONTEXT,
	next: Next<CONTEXT>,
): Promise<Response>;
