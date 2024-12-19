import type { Middleware } from "../middleware.js";
import type { RouterContext } from "./router.js";

export function strictPathCheck(
	middlewares: Middleware<RouterContext>[],
): Middleware<RouterContext>;
