/** @import * as self from "./router.js" */

import { composeMiddleware } from "../middleware.js";
import { buildJitStaticPage } from "./buildJitStaticPage.js";
import { forceGenerateStaticPage } from "./forceGenerateStaticPage.js";
import { generateDynamicPage } from "./generateDynamicPage.js";
import { refreshStaticPage } from "./refreshStaticPage.js";
import { serveFromCacheStaticPage } from "./serveFromCacheStaticPage.js";
import { watchModeStaticPage } from "./watchModeStaticPage.js";

/** @type {self.router} */
export function router(routes) {
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

				if (route.page.type === "dynamic") {
					return generateDynamicPage(routerContext, next);
				}
				if (route.page.type === "static") {
					if (route.page.strictPaths && route.paramList !== undefined) {
						const isValidPath = route.paramList.some(
							(params) => route.page.compile(params) === context.url.pathname,
						);

						if (!isValidPath) {
							context.log(
								`Page "${route.page.entrypoint}" did not have "${context.url.pathname}" in its generated path list . Yield.`,
								{
									level: "debug",
									scope: "router",
								},
							);
							return next(context);
						}
					}

					return staticPageMiddleware(routerContext, next);
				}
			}
		}

		context.log("No matching page found. Yield.", {
			level: "debug",
			scope: "router",
		});

		return next(context);
	};
}

const staticPageMiddleware = composeMiddleware([
	forceGenerateStaticPage,
	refreshStaticPage,
	watchModeStaticPage,
	serveFromCacheStaticPage,
	buildJitStaticPage,
]);
