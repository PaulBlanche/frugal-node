import type { Next } from "../middleware.js";
import type { RouterContext } from "./router.js";

export function serveFromCacheStaticPage(
	context: RouterContext,
	next: Next<RouterContext>,
): Promise<Response>;
