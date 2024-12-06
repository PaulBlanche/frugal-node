/** @import * as self from "./refreshStaticPage.js" */

import { isRefreshTokenValid } from "../../utils/crypto.js";

export const REFRESH_TOKEN_QUERY_PARAM = "frugal_refresh_token";

/** @type {self.refreshStaticPage} */
export async function refreshStaticPage(context, next) {
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

	const token = context.url.searchParams.get(REFRESH_TOKEN_QUERY_PARAM);
	const isValid =
		token === null ? false : await isRefreshTokenValid(await context.cryptoKey, token);
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