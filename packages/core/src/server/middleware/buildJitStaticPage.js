/** @import * as self from "./buildJitStaticPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";

/** @type {self.buildJitStaticPage} */
export async function buildJitStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	context.log("JIT build static page.", {
		scope: "buildJitStaticPage",
		level: "debug",
	});

	const frugalResponse = await context.route.producer.build({
		params: context.params,
	});

	if (frugalResponse === undefined) {
		context.log("No response was generated. Yield.", {
			scope: "buildJitStaticPage",
			level: "debug",
		});

		return next(context);
	}

	if (context.cache) {
		await context.cache.add(frugalResponse);
	}

	return toResponse(frugalResponse);
}
