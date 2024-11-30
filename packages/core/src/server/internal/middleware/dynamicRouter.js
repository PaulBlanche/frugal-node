/** @import * as self from "./dynamicRouter.js" */

import { toResponse } from "../../../page/FrugalResponse.js";

/** @type {self.dynamicRouter} */
export function dynamicRouter(routes) {
	return async (context, next) => {
		if (context.type !== "dynamic") {
			return next(context);
		}

		const { producer } = routes[context.index];
		const params = context.params;

		context.session?.persist();

		const generationResponse = await producer.generate({
			// shallow copy of params because path-to-regexp returns
			// an object with a null prototype that breaks
			// hashableJsonValue.
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
	};
}
