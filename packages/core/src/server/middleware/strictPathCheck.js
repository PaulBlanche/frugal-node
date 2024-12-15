/** @import * as self from "./strictPathCheck.js" */

import { composeMiddleware } from "../middleware.js";

/** @type {self.strictPathCheck} */
export function strictPathCheck(middlewares) {
	const staticPageMiddleware = composeMiddleware(middlewares);

	return (context, next) => {
		if (context.route.page.type !== "static") {
			return next(context);
		}

		if (context.route.page.strictPaths && context.route.paramList !== undefined) {
			const isValidPath = context.route.paramList.some(
				(params) => context.route.page.compile(params) === context.url.pathname,
			);

			if (!isValidPath) {
				context.log(
					`Page "${context.route.page.entrypoint}" did not have "${context.url.pathname}" in its generated path list. Yield.`,
					{
						level: "debug",
						scope: "router",
					},
				);
				return next(context);
			}
		}

		return staticPageMiddleware(context, next);
	};
}
