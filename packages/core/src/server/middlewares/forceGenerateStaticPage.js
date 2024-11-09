/** @import * as self from "./forceGenerateStaticPage.js" */

import { toResponse } from "../../page/FrugalResponse.js";
import { FORCE_GENERATE_COOKIE } from "../../page/PageResponse.js";
import { getCookies, setCookie } from "../../utils/cookies.js";

/** @type {self.forceGenerateStaticPage} */
export async function forceGenerateStaticPage(context, next) {
	const cookies = getCookies(context.request.headers);
	const forceGenerate = cookies[FORCE_GENERATE_COOKIE] === "true";

	if (!forceGenerate && context.request.method === "GET") {
		return next(context);
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

	if (forceGenerate) {
		setCookie(response.headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: "false",
			expires: new Date(0),
			maxAge: 0,
		});
	}

	return response;
}
