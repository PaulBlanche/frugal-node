/** @import * as self from "./watchModeStaticPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";

/** @type {self.watchModeStaticPage} */
export async function watchModeStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (!context.watch) {
		return next(context);
	}

	context.log("Rebuild static page for watch mode", {
		scope: "watchModeStaticPage",
		level: "debug",
	});

	const cachedResponse = await context.cache?.get(context.request.url);

	const frugalResponse = await context.route.producer.generate({
		request: context.request,
		path: context.url.pathname,
		params: context.params,
		state: context.state,
		session: context.session,
	});

	if (frugalResponse === undefined) {
		context.log("No response was generated. Yield.", {
			scope: "watchModeStaticPage",
			level: "debug",
		});

		return next(context);
	}

	// if hash is same, keep generation date
	if (cachedResponse !== undefined && cachedResponse.hash === frugalResponse.hash) {
		frugalResponse.setDateFrom(cachedResponse);
	}

	await context.cache?.add(frugalResponse);

	const response = toResponse(frugalResponse);

	return response;
}
