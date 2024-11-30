import type { Middleware } from "../../middleware.js";
import type { Context } from "../context.js";

type ExtraContext = {
	index: number;
	params: Partial<Record<string, string | string[]>>;
} & ({ type: "static"; op: "generate" | "refresh" | "serve" } | { type: "dynamic" });

type AuthContext = Context & ExtraContext;

export function auth(middlewares: Middleware<AuthContext>[]): Middleware<Context>;
