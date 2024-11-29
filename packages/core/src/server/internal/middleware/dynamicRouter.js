/** @import * as self from "./dynamicRouter.js" */

import { toResponse } from "../../../page/FrugalResponse.js";

/** @type {self.dynamicRouter} */
export function dynamicRouter(routes) {
	return async (context, next) => {
		//TODO: send route type + index to skip iteration + match
		for (const { page, producer } of routes) {
			const match = page.match(context.url.pathname);

			if (match) {
				context.session?.persist();

				const generationResponse = await producer.generate({
					// shallow copy of params because path-to-regexp returns
					// an object with a null prototype that breaks
					// hashableJsonValue.
					params: { ...match.params },
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
		}

		context.log(`no route found for ${context.url.pathname}. Yield.`, {
			level: "debug",
			scope: "staticRouter",
		});

		return next(context);
	};
}
