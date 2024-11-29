/** @import * as self from "./refreshStaticPage.js" */

import { parseToken } from "../../../utils/crypto.js";
import { compress } from "../compress.js";

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

	const token = context.url.searchParams.get("token");
	const payload = token === null ? undefined : await parseToken(context.cryptoKey, token);
	if (payload === undefined || payload["op"] !== "rf") {
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

	const response = await context.internal(context, "refresh");
	const compressedResponse = compress(context, response);
	await context.cache.add(context.request.url, compressedResponse);

	return new Response(null, {
		status: 303, // see other
		headers: {
			Location: context.url.pathname,
		},
	});
}
