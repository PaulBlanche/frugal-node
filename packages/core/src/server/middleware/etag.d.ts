import type { Context } from "../context.js";
import type { Next } from "../middleware.js";

export function etag(context: Context, next: Next<Context>): Promise<Response>;
