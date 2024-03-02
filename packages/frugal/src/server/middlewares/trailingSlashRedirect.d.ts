import { BaseContext } from "../context.js";
import { Next } from "../middleware.js";

export function trailingSlashRedirect(
	context: BaseContext,
	next: Next<BaseContext>,
): Response | Promise<Response>;
