import type { Next } from "../../middleware.js";
import type { Context } from "../context.js";

export function refreshStaticPage(context: Context, next: Next<Context>): Promise<Response>;
