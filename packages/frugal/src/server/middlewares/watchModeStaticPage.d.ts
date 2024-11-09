import type { RouteContext } from "../context.js";
import type { Next } from "../middleware.js";

export function watchModeStaticPage(
	context: RouteContext<"static">,
	next: Next<RouteContext<"static">>,
): Promise<Response>;
