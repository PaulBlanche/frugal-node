/** @import * as self from "./forceGenerateStaticPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";
import { FORCE_GENERATE_COOKIE } from "../../page/FrugalResponse.js";
import { getCookies, setCookie } from "../../utils/cookies.js";
import { isTokenValid } from "../../utils/crypto.js";

/** @type {self.forceGenerateStaticPage} */
export async function forceGenerateStaticPage(context, next) {
	// GET requests need a valid token in a force_generate_cookie to dynamically generate.
	// Other HTTP method are dynamic by default
	if (context.request.method === "GET") {
		const cryptoKey = await context.config.cryptoKey;
		if (cryptoKey === undefined) {
			context.log("no crypto key in config. Yield.", {
				level: "debug",
				scope: "forceGenerateStaticPage",
			});

			return next(context);
		}

		const cookies = getCookies(context.request.headers);
		const token = cookies[FORCE_GENERATE_COOKIE];
		const tokenTimeout = 10 * 1000; // 10s
		const hasValidToken = token !== undefined && isTokenValid(cryptoKey, token, tokenTimeout);

		// Get method
		if (!hasValidToken) {
			context.log("invalid force generate token. Yield.", {
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

	const generationResponse = await context.producer.generate({
		request: context.request,
		path: context.url.pathname,
		params: context.params,
		state: context.state,
		session: context.session,
	});

	if (generationResponse === undefined) {
		return next(context);
	}

	const response = toResponse(generationResponse);

	// reset the force_generate_cookie
	setCookie(response.headers, {
		httpOnly: true,
		name: FORCE_GENERATE_COOKIE,
		value: "",
		expires: new Date(0),
		maxAge: 0,
	});

	return response;
}
