import * as context from "../context.js";
import * as middleware from "../middleware.js";
import { serveFromCacheStaticPage } from "./serveFromCacheStaticPage.js";

/**
 * @param {context.RouteContext<"static">} context
 * @param {middleware.Next<context.RouteContext<"static">>} next
 * @returns {Promise<Response>}
 */
export async function refreshJitStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (context.page.strictPaths) {
		const pathList = await context.page.getBuildPaths({
			resolve: (path) => context.config.resolve(path),
		});
		const hasMatchingPath = pathList.some((path) => {
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

	const generationResponse = await context.producer.refresh(context.params);

	if (generationResponse === undefined) {
		return next(context);
	}

	await context.cache.add(generationResponse);

	return serveFromCacheStaticPage(context, next);
}
