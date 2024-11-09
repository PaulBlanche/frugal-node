import type { RouteContext } from "../context.js";
import type { Next } from "../middleware.js";

export function dynamicRoute(
	context: RouteContext<"dynamic">,
	next: Next<RouteContext<"dynamic">>,
): Promise<Response>;
