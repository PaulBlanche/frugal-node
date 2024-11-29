import type { Next } from "../../middleware.js";
import type { Context } from "../context.js";

export function watchModeResponseModification(
	context: Context,
	next: Next<Context>,
): Promise<Response>;
