/** @import * as self from "./generateDynamicPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";

/** @type {self.generateDynamicPage} */
export async function generateDynamicPage(context, next) {
	if (context.route.page.type !== "dynamic") {
		return next(context);
	}

	const params = context.params;

	const generationResponse = await context.route.producer.generate({
		params,
		request: context.request,
		path: context.url.pathname,
		state: context.state,
		session: context.session,
	});

	if (generationResponse === undefined) {
		return next(context);
	}

	return toResponse(generationResponse);
}
