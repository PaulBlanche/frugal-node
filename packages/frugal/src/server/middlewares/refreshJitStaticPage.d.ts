import { RouteContext } from "../context.js";
import { Next } from "../middleware.js";

export function refreshJitStaticPage(
	context: RouteContext<"static">,
	next: Next<RouteContext<"static">>,
): Promise<Response>;
