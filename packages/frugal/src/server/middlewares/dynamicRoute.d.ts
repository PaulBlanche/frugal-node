import { RouteContext } from "../context.ts";
import { Next } from "../middleware.ts";

export function dynamicRoute(
	context: RouteContext<"dynamic">,
	next: Next<RouteContext<"dynamic">>,
): Promise<Response>;
