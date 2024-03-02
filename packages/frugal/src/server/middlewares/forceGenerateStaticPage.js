import { toResponse } from "../../page/GenerationResponse.js";
import { FORCE_GENERATE_COOKIE } from "../../page/PageResponse.js";
import { getCookies, setCookie } from "../../utils/cookies.js";

/** @type {import('./forceGenerateStaticPage.ts').forceGenerateStaticPage} */
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

	const generationResponse = await context.producer.generate(
		context.request,
		context.url.pathname,
		context.params,
		context.state,
		context.session,
	);

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
