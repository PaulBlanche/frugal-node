import type { Next } from "../../middleware.js";
import type { Context } from "../context.js";

export function trailingSlashRedirect(
	context: Context,
	next: Next<Context>,
): Response | Promise<Response>;
