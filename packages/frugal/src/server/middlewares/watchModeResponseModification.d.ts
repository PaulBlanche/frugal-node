import type { BaseContext } from "../context.js";
import type { Next } from "../middleware.js";

export function watchModeResponseModification(
	context: BaseContext,
	next: Next<BaseContext>,
): Promise<Response>;
