/** @import * as self from "./staticRouter.js" */

import { toResponse } from "../../../page/FrugalResponse.js";

/** @type {self.staticRouter} */
export function staticRouter(routes) {
	return async (context, next) => {
		if (context.type !== "static") {
			return next(context);
		}

		const { page, producer, paramList } = routes[context.index];
		const params = context.params;

		context.session?.persist();

		const isValidStrictPath =
			paramList === undefined
				? true
				: paramList.some((params) => {
						return page.compile(params) === context.url.pathname;
					});

		if (!isValidStrictPath) {
			context.log(
				`Page "${page.entrypoint}" did not have "${context.url.pathname}" in its generated path list . Yield.`,
				{
					level: "debug",
					scope: "staticRouter",
				},
			);
			return next(context);
		}

		const generationResponse =
			context.op === "generate"
				? await producer.generate({
						params,
						request: context.request,
						path: context.url.pathname,
						state: context.state,
						session: context.session,
					})
				: await producer.build({
						params,
					});

		if (generationResponse === undefined) {
			return next(context);
		}

		console.log(generationResponse);

		return toResponse(generationResponse);
	};
}
