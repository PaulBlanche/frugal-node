import * as assets from "../../page/Assets.js";
import * as page from "../../page/Page.js";
import { Producer } from "../../page/Producer.js";
import * as context from "../context.js";
import * as middleware from "../middleware.js";
import { dynamicRoute } from "./dynamicRoute.js";
import { etag } from "./etag.js";
import { forceGenerateStaticPage } from "./forceGenerateStaticPage.js";
import { refreshJitStaticPage } from "./refreshJitStaticPage.js";
import { refreshStaticPage } from "./refreshStaticPage.js";
import { serveFromCacheStaticPage } from "./serveFromCacheStaticPage.js";
import { watchModeStaticPage } from "./watchModeStaticPage.js";

/**
 * @param {{ producer: Producer, page: page.Page }[]} routes
 * @returns {middleware.Middleware<context.BaseContext>}
 */
export function router(routes) {
	return (context, next) => {
		for (const { page, producer } of routes) {
			const match = page.match(context.url.pathname);
			if (match) {
				context.session?.persist();

				return composedMiddleware(
					{
						...context,
						page,
						// shallow copy of params because path-to-regexp returns
						// an object with a null prototype that breaks
						// hashableJsonValue.
						params: { ...match.params },
						producer,
					},
					next,
				);
			}
		}

		context.log(`no route found for ${context.url.pathname}. Yield.`, {
			level: "debug",
			scope: "route",
		});

		return next(context);
	};
}

/** @type {middleware.Middleware<context.RouteContext>} */
const composedMiddleware = middleware.composeMiddleware([
	//csrf,
	etag,
	staticOrDynamic,
]);

/**
 * @param {context.RouteContext} context
 * @param {middleware.Next<context.RouteContext>} next
 * @returns {Promise<Response>}
 */
function staticOrDynamic(context, next) {
	if (context.page.type === "dynamic") {
		return dynamicRoute(
			{
				...context,
				page: context.page,
			},
			next,
		);
	}

	return Promise.resolve(
		staticRoute(
			{
				...context,
				page: context.page,
			},
			next,
		),
	);
}

/** @type {middleware.Middleware<context.RouteContext<'static'>>} */
const staticRoute = middleware.composeMiddleware(
	[
		forceGenerateStaticPage,
		refreshStaticPage,
		process.env.NODE_ENV !== "production" && watchModeStaticPage,
		serveFromCacheStaticPage,
		refreshJitStaticPage,
	].filter(
		/** @returns {middleware is ((context: context.RouteContext<"static">, next: middleware.Next<context.RouteContext<"static">>) => Promise<Response>)} */
		(middleware) => Boolean(middleware),
	),
);
