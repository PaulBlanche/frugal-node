/** @import * as self from "./middleware.js" */

/** @type {self.composeMiddleware} */
export function composeMiddleware(middlewares) {
	return middlewares.reduceRight(
		(composedMiddleware, middleware) => {
			return typeof middleware === "function"
				? (context, next) =>
						middleware(context, (context) =>
							Promise.resolve(composedMiddleware(context, next)),
						)
				: composedMiddleware;
		},
		(context, next) => next(context),
	);
}
