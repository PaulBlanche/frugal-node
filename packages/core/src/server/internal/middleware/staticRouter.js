/** @import * as self from "./staticRouter.js" */

import { toResponse } from "../../../page/FrugalResponse.js";

/** @type {self.staticRouter} */
export function staticRouter(routes) {
	return async (context, next) => {
		for (const { page, producer, paramList } of routes) {
			const match = page.match(context.url.pathname);

			if (match) {
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

				const type = context.state["_frugal_type"];
				const generationResponse =
					type === "generate"
						? await producer.generate({
								// shallow copy of params because path-to-regexp returns
								// an object with a null prototype that breaks
								// hashableJsonValue.
								params: { ...match.params },
								request: context.request,
								path: context.url.pathname,
								state: context.state,
								session: context.session,
							})
						: await producer.build({
								// shallow copy of params because path-to-regexp returns
								// an object with a null prototype that breaks
								// hashableJsonValue.
								params: { ...match.params },
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
