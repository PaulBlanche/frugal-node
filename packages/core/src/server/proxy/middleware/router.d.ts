import type { Page } from "../../../page/Page.js";
import type { Middleware } from "../../middleware.js";
import type { Context } from "../context.js";

type Route = { type: "static" | "dynamic"; page: Page };

export function router(routes: Route[]): Middleware<Context>;
