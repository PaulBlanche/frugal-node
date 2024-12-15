import type { Page } from "../../page/Page.js";
import type { Producer } from "../../page/Producer.js";
import type { Context } from "../context.js";
import type { Middleware } from "../middleware.js";

export type Route = {
	page: Page;
	producer: Producer;
	paramList?: Partial<Record<string, string | string[]>>[];
};

export type RouterContext = Context & {
	route: Route;
	params: Partial<Record<string, string | string[]>>;
};

export function router(
	routes: Route[],
	middlewares: Middleware<RouterContext>[],
): Middleware<Context>;
