import type { Middleware } from "../../middleware.js";
import type { Context } from "../context.js";

export function auth(): Middleware<Context>;
