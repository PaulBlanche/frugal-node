import type { Next } from "../../middleware.js";
import type { RouterContext } from "./router.js";

export function serveStaticPage(
	context: RouterContext,
	next: Next<RouterContext>,
): Promise<Response>;
