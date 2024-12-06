/** @import * as self from "./serveFromCacheStaticPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";

/** @type {self.serveFromCacheStaticPage} */
export async function serveFromCacheStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (context.cache === undefined) {
		context.log("No cache configured. Yield.", {
			level: "debug",
			scope: "serveFromCacheStaticPage",
		});
		return next(context);
	}

	const response = await context.cache.get(context.url.pathname);

	if (response === undefined) {
		context.log("No response found in cache. Yield.", {
			scope: "serveFromCacheStaticPage",
			level: "debug",
		});

		return next(context);
	}

	if (response.maxAge >= 0) {
		const generationTimestamp = new Date(response.date).getTime();
		const age = Date.now() - generationTimestamp;
		if (age > response.maxAge * 1000) {
			context.log("Response in cache is stale. Yield.", {
				scope: "serveFromCacheStaticPage",
				level: "debug",
			});

			return next(context);
		}
	}

	context.log("Serving static page from cache", {
		level: "debug",
		scope: "serveFromCacheStaticPage",
	});

	return toResponse(response);
}
