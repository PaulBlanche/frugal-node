import { BaseContext } from "../context.js";
import { Next } from "../middleware.js";

export function staticFile(context: BaseContext, next: Next<BaseContext>): Promise<Response>;
