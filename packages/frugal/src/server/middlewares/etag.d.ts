import { BaseContext } from "../context.ts";
import { Next } from "../middleware.ts";

export function etag<CONTEXT extends BaseContext>(
	context: CONTEXT,
	next: Next<CONTEXT>,
): Promise<Response>;
