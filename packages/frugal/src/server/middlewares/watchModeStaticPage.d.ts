import { RouteContext } from "../context.js";
import { Next } from "../middleware.js";

export function watchModeStaticPage(
	context: RouteContext<"static">,
	next: Next<RouteContext<"static">>,
): Response | Promise<Response>;
