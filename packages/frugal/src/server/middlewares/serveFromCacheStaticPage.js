import * as context from "../context.js";
import * as middleware from "../middleware.js";

/**
 * @param {context.RouteContext<"static">} context
 * @param {middleware.Next<context.RouteContext<"static">>} next
 * @returns {Promise<Response>}
 */
export async function serveFromCacheStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	const url = new URL(context.request.url);
	const cachedResponse = await context.cache.get(url.pathname);

	if (cachedResponse === undefined) {
		return next(context);
	}

	context.log("Serving static page from cache", {
		level: "debug",
		scope: "serveFromCacheStaticPage",
	});

	return cachedResponse;
}
