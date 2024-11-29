import type { Next } from "../../middleware.js";
import type { Context } from "../context.js";

export function etag(context: Context, next: Next<Context>): Promise<Response>;
