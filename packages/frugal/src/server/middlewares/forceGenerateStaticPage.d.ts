import { RouteContext } from "../context.js";
import { Next } from "../middleware.js";

export function forceGenerateStaticPage(
	context: RouteContext<"static">,
	next: Next<RouteContext<"static">>,
): Promise<Response>;
