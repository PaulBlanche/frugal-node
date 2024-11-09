/** @import * as self from "./refreshJitStaticPage.js" */

import { serveFromCacheStaticPage } from "./serveFromCacheStaticPage.js";

/** @type {self.refreshJitStaticPage} */
export async function refreshJitStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (context.page.strictPaths) {
		const pathList = await context.page.getBuildPaths();
		const hasMatchingPath = pathList.some((path) => {
			console.log(context.page.compile(path), context.url.pathname);
			return context.page.compile(path) === context.url.pathname;
		});

		if (!hasMatchingPath) {
			return next(context);
		}
	}

	context.log("refresh page", {
		level: "debug",
		scope: "refreshJitStaticPage",
	});

	const generationResponse = await context.producer.refresh({
		request: context.request,
		params: context.params,
		jit: true,
	});

	if (generationResponse === undefined) {
		return next(context);
	}

	await context.cache.add(generationResponse);

	return serveFromCacheStaticPage(context, next);
}
