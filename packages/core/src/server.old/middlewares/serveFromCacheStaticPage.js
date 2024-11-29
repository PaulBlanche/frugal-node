/** @import * as self from "./serveFromCacheStaticPage.js" */

/** @type {self.serveFromCacheStaticPage} */
export async function serveFromCacheStaticPage(context, next) {
	if (context.request.method !== "GET" || context.cache === undefined) {
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
