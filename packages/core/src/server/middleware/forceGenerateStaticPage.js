/** @import * as self from "./forceGenerateStaticPage.js" */

import { FORCE_GENERATE_COOKIE, toResponse } from "../../page/FrugalResponse.js";
import { getCookies, setCookie } from "../../utils/cookies.js";
import { isForceGenerateTokenValid } from "../../utils/crypto.js";

/** @type {self.forceGenerateStaticPage} */
export async function forceGenerateStaticPage(context, next) {
	const cookies = getCookies(context.request.headers);
	const token = cookies[FORCE_GENERATE_COOKIE];

	if (context.request.method === "GET") {
		const isValid =
			token === undefined
				? false
				: await isForceGenerateTokenValid(await context.cryptoKey, token);

		if (!isValid) {
			context.log("Invalid token. Yield.", {
				level: "debug",
				scope: "forceGenerateStaticPage",
			});

			return next(context);
		}
	}

	context.log("Force dynamic generation of static page.", {
		scope: "forceGenerateStaticPage",
		level: "debug",
	});

	const frugalResponse = await context.route.producer.generate({
		params: context.params,
		request: context.request,
		path: context.url.pathname,
		state: context.state,
		session: context.session,
	});

	if (frugalResponse === undefined) {
		context.log("No response was generated. Yield.", {
			scope: "forceGenerateStaticPage",
			level: "debug",
		});

		return next(context);
	}

	const response = toResponse(frugalResponse);

	if (token !== undefined) {
		setCookie(response.headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: "",
			expires: new Date(0),
			maxAge: 0,
		});
	}

	return response;
}
