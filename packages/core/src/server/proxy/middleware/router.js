/** @import * as self from "./router.js" */

import { composeMiddleware } from "../../middleware.js";
import { compress } from "../compress.js";
import { forceGenerateStaticPage } from "./forceGenerateStaticPage.js";
import { refreshStaticPage } from "./refreshStaticPage.js";
import { serveStaticPage } from "./serveStaticPage.js";

/** @type {self.router} */
export function router(routes) {
	return async (context, next) => {
		for (const { type, page } of routes) {
			const match = page.match(context.url.pathname);

			if (match) {
				if (type === "dynamic") {
					const response = await context.internal(context, "generate");
					return compress(context, response);
				}
				if (type === "static") {
					return staticMiddleware(context, next);
				}
			}
		}

		return next(context);
	};
}

const staticMiddleware = composeMiddleware([
	forceGenerateStaticPage,
	refreshStaticPage,
	serveStaticPage,
]);
