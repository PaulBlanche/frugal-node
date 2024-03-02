import { BaseContext } from "../context.js";
import { Next } from "../middleware.js";

export function watchModeResponseModification(
	context: BaseContext,
	next: Next<BaseContext>,
): Response | Promise<Response>;
