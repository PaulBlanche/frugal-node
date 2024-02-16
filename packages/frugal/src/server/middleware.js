import * as _type from "./_type/middleware.js";

/**
 * @template CONTEXT
 * @typedef {_type.Middleware<CONTEXT>} Middleware<CONTEXT>
 */

/**
 * @template CONTEXT
 * @typedef {_type.Next<CONTEXT>} Next<CONTEXT>
 */

/**
 * @template CONTEXT
 * @param {_type.Middleware<CONTEXT>[]} middlewares
 * @returns {_type.Middleware<CONTEXT>}
 */
export function composeMiddleware(middlewares) {
	return middlewares.reduceRight(
		/**
		 * @param {_type.Middleware<CONTEXT>} composedMiddleware
		 * @param {false|null|undefined|_type.Middleware<CONTEXT>} middleware
		 * @returns {_type.Middleware<CONTEXT>}
		 */
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
