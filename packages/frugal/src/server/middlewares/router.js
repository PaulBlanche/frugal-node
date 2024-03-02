import { composeMiddleware } from "../middleware.js";
import { dynamicRoute } from "./dynamicRoute.js";
import { etag } from "./etag.js";
import { forceGenerateStaticPage } from "./forceGenerateStaticPage.js";
import { refreshJitStaticPage } from "./refreshJitStaticPage.js";
import { refreshStaticPage } from "./refreshStaticPage.js";
import { serveFromCacheStaticPage } from "./serveFromCacheStaticPage.js";
import { watchModeStaticPage } from "./watchModeStaticPage.js";

/** @type {import('./router.ts').router} */
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

/** @type {import("../middleware.ts").Middleware<import("../context.ts").RouteContext>} */
const composedMiddleware = composeMiddleware([
	//csrf,
	etag,
	staticOrDynamic,
]);

/**
 * @param {import("../context.ts").RouteContext} context
 * @param {import("../middleware.ts").Next<import("../context.ts").RouteContext>} next
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

/** @type {import("../middleware.ts").Middleware<import("../context.ts").RouteContext<'static'>>} */
const staticRoute = composeMiddleware(
	[
		forceGenerateStaticPage,
		refreshStaticPage,
		process.env.NODE_ENV !== "production" && watchModeStaticPage,
		serveFromCacheStaticPage,
		refreshJitStaticPage,
	].filter(
		/** @returns {middleware is ((context: import("../context.ts").RouteContext<"static">, next: import("../middleware.ts").Next<import("../context.ts").RouteContext<"static">>) => Promise<Response>)} */
		(middleware) => Boolean(middleware),
	),
);
