import type { RouteContext } from "../context.ts";
import type { Next } from "../middleware.ts";

export function dynamicRoute(
	context: RouteContext<"dynamic">,
	next: Next<RouteContext<"dynamic">>,
): Promise<Response>;
