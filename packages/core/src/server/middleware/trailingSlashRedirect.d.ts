import type { Context } from "../context.js";
import type { Next } from "../middleware.js";

export function trailingSlashRedirect(
	context: Context,
	next: Next<Context>,
): Response | Promise<Response>;
