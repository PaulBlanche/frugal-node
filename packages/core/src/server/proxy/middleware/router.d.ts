import type { Page } from "../../../page/Page.js";
import type { Middleware } from "../../middleware.js";
import type { Context } from "../context.js";

type Route = {
	type: "static" | "dynamic";
	page: Page;
	index: number;
};

export type RouterContext = Context & {
	index: number;
	params: Partial<Record<string, string | string[]>>;
};

export function router(routes: Route[]): Middleware<Context>;
