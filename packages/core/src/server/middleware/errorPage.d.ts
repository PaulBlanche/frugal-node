import type { Context } from "../context.js";
import type { Middleware } from "../middleware.js";

export function errorPage(page: Record<number, string>, rootDir: string): Middleware<Context>;

export function errorHtml(status: number, message?: string): string;
