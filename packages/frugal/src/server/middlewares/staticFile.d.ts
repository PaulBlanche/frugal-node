import type { BaseContext } from "../context.js";
import type { Next } from "../middleware.js";

export function staticFile(context: BaseContext, next: Next<BaseContext>): Promise<Response>;
