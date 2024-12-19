/** @import * as self from "./router.js" */

import { composeMiddleware } from "../middleware.js";

/** @type {self.router} */
export function router(routes, middlewares) {
	const routerMiddlewares = composeMiddleware(middlewares);
	return (context, next) => {
		for (const route of routes) {
			const match = route.page.match(context.url.pathname);

			if (match) {
				context.session?.persist();

				context.log(
					`Matching page "${route.page.entrypoint}" (${route.page.type}) with route "${route.page.route}" found for "${context.url.pathname}" `,
					{
						level: "debug",
						scope: "router",
					},
				);

				const routerContext = {
					...context,
					route,
					// shallow copy of params because path-to-regexp returns
					// an object with a null prototype that breaks
					// hashableJsonValue.
					params: { ...match.params },
				};

				return routerMiddlewares(routerContext, next);
			}
		}

		context.log("No matching page found. Yield.", {
			level: "debug",
			scope: "router",
		});

		return next(context);
	};
}
