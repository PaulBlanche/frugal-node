/** @import * as self from "./router.js" */

import { composeMiddleware } from "../../middleware.js";
import { compress } from "../compress.js";
import { forceGenerateStaticPage } from "./forceGenerateStaticPage.js";
import { refreshStaticPage } from "./refreshStaticPage.js";
import { serveStaticPage } from "./serveStaticPage.js";
import { watchStaticPage } from "./watchStaticPage.js";

/** @type {self.router} */
export function router(routes) {
	return async (context, next) => {
		for (const { type, page, index } of routes) {
			const match = page.match(context.url.pathname);
			console.log(page.route, context.url.pathname, match);

			if (match) {
				if (type === "dynamic") {
					const response = await context.internal(context, {
						type: "dynamic",
						index,
						params: { ...match.params },
					});
					return compress(context, response);
				}
				if (type === "static") {
					return staticMiddleware(
						{ ...context, index, params: { ...match.params } },
						next,
					);
				}
			}
		}

		console.log("no match");
		return next(context);
	};
}

const staticMiddleware = composeMiddleware([
	forceGenerateStaticPage,
	refreshStaticPage,
	watchStaticPage,
	serveStaticPage,
]);
