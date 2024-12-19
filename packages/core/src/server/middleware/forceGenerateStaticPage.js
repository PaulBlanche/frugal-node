/** @import * as self from "./forceGenerateStaticPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";

/** @type {self.forceGenerateStaticPage} */
export async function forceGenerateStaticPage(context, next) {
	const shouldForceGenerate = await context.cacheHandler.shouldForceGenerate(context.request);
	let shouldCleanForceGenerate = false;

	if (context.request.method === "GET") {
		if (!shouldForceGenerate) {
			context.log("Should not force generate. Yield.", {
				level: "debug",
				scope: "forceGenerateStaticPage",
			});

			return next(context);
		}

		shouldCleanForceGenerate = true;
	}

	context.log("Force dynamic generation of static page.", {
		scope: "forceGenerateStaticPage",
		level: "debug",
	});

	const frugalResponse = await context.route.producer.generate({
		params: context.params,
		request: context.request,
		path: context.url.pathname,
		state: context.state,
		session: context.session,
	});

	if (frugalResponse === undefined) {
		context.log("No response was generated. Yield.", {
			scope: "forceGenerateStaticPage",
			level: "debug",
		});

		return next(context);
	}

	const response = toResponse(frugalResponse);

	if (shouldCleanForceGenerate) {
		await context.cacheHandler.cleanupForceGenerate(response);
	}

	return response;
}
