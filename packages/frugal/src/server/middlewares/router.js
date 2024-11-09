/** @import * as self from "./router.js" */
/** @import * as middleware from "../middleware.js" */
/** @import * as context from "../context.js" */

import { composeMiddleware } from "../middleware.js";
import { dynamicRoute } from "./dynamicRoute.js";
import { etag } from "./etag.js";
import { forceGenerateStaticPage } from "./forceGenerateStaticPage.js";
import { refreshJitStaticPage } from "./refreshJitStaticPage.js";
import { refreshStaticPage } from "./refreshStaticPage.js";
import { serveFromCacheStaticPage } from "./serveFromCacheStaticPage.js";
import { watchModeStaticPage } from "./watchModeStaticPage.js";

/** @type {self.router} */
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
const composedMiddleware = composeMiddleware([
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
const staticRoute = composeMiddleware(
	[
		forceGenerateStaticPage,
		refreshStaticPage,
		watchModeStaticPage,
		serveFromCacheStaticPage,
		refreshJitStaticPage,
	].filter(
		/** @returns {middleware is ((context: context.RouteContext<"static">, next: middleware.Next<context.RouteContext<"static">>) => Promise<Response>)} */
		(middleware) => Boolean(middleware),
	),
);
