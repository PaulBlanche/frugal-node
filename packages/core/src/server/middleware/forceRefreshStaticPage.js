/** @import * as self from "./forceRefreshStaticPage.js" */

import { FORCE_REFRESH_HEADER } from "../../page/FrugalResponse.js";
import { isForceRefreshTokenValid } from "../../utils/crypto.js";

/** @type {self.forceRefreshStaticPage} */
export async function forceRefreshStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (context.cache === undefined) {
		context.log("No cache configured. Yield.", {
			level: "debug",
			scope: "refreshStaticPage",
		});
		return next(context);
	}

	const token = context.request.headers.get(FORCE_REFRESH_HEADER);
	const isValid =
		token === null ? false : await isForceRefreshTokenValid(await context.cryptoKey, token);
	if (!isValid) {
		context.log("Invalid token. Yield.", {
			level: "debug",
			scope: "refreshStaticPage",
		});
		return next(context);
	}

	context.log("Refresh static page.", {
		scope: "refreshStaticPage",
		level: "debug",
	});

	const frugalResponse = await context.route.producer.build({
		params: context.params,
	});

	if (frugalResponse === undefined) {
		context.log("No response was generated. Yield.", {
			scope: "refreshStaticPage",
			level: "debug",
		});

		return next(context);
	}

	await context.cache.add(frugalResponse);

	return new Response(null, {
		status: 307, // Temporary Redirect
		headers: {
			Location: context.url.pathname,
		},
	});
}
