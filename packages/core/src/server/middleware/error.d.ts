import type { Context } from "../context.js";
import type { Middleware } from "../middleware.js";

export function error(page: Record<number, string>): Middleware<Context>;

export function errorHtml(status: number): string;
