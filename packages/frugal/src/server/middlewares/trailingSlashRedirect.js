import * as context from "../context.js";
import * as middleware from "../middleware.js";

/**
 * @param {context.BaseContext} context
 * @param {middleware.Next<context.BaseContext>} next
 * @returns {Promise<Response> | Response}
 */
export function trailingSlashRedirect(context, next) {
	const url = new URL(context.request.url);
	if (url.pathname.endsWith("/") && url.pathname !== "/") {
		return new Response(undefined, {
			status: 301,
			headers: {
				Location: url.pathname.slice(0, -1),
			},
		});
	}

	return next(context);
}
