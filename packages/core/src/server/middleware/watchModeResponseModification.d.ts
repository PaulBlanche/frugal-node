import type { Context } from "../context.js";
import type { Next } from "../middleware.js";

export function watchModeResponseModification(
	context: Context,
	next: Next<Context>,
): Promise<Response>;
