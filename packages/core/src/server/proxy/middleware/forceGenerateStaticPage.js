/** @import * as self from "./forceGenerateStaticPage.js" */

import { FORCE_GENERATE_COOKIE } from "../../../page/FrugalResponse.js";
import { getCookies, setCookie } from "../../../utils/cookies.js";
import { parseToken } from "../../../utils/crypto.js";
import { compress } from "../compress.js";

/** @type {self.forceGenerateStaticPage} */
export async function forceGenerateStaticPage(context, next) {
	let clearCookie = false;
	if (context.request.method === "GET") {
		const cookies = getCookies(context.request.headers);
		const token = cookies[FORCE_GENERATE_COOKIE];
		const payload =
			token === undefined ? undefined : await parseToken(context.cryptoKey, token);

		if (payload === undefined || payload["op"] !== "fg") {
			context.log("Invalid token. Yield.", {
				level: "debug",
				scope: "forceGenerateStaticPage",
			});

			return next(context);
		}
		clearCookie = true;
	}

	context.log("Force dynamic generation of static page.", {
		scope: "forceGenerateStaticPage",
		level: "debug",
	});

	const response = await context.internal(context, {
		type: "static",
		op: "generate",
		index: context.index,
		params: context.params,
	});

	if (clearCookie) {
		setCookie(response.headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: "",
			expires: new Date(0),
			maxAge: 0,
		});
	}

	return compress(context, response);
}
