import type { BaseContext } from "../context.js";
import type { Next } from "../middleware.js";

export function trailingSlashRedirect(
	context: BaseContext,
	next: Next<BaseContext>,
): Response | Promise<Response>;
