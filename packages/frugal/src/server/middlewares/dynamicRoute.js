/** @import * as self from "./dynamicRoute.js" */

import { toResponse } from "../../page/FrugalResponse.js";

/** @type {self.dynamicRoute} */
export async function dynamicRoute(context, next) {
	context.log("Generation of dynamic page", { level: "debug", scope: "dynamicRoute" });

	const generationResponse = await context.producer.generate({
		request: context.request,
		path: context.url.pathname,
		params: context.params,
		state: context.state,
		session: context.session,
	});

	if (generationResponse === undefined) {
		return next(context);
	}

	return toResponse(generationResponse);
}
