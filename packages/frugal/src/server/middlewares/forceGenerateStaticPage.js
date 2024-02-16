import { toResponse } from "../../page/GenerationResponse.js";
import { FORCE_GENERATE_COOKIE } from "../../page/PageResponse.js";
import * as http from "../../utils/http.js";
import * as context from "../context.js";
import * as middleware from "../middleware.js";

/**
 * @param {context.RouteContext<"static">} context
 * @param {middleware.Next<context.RouteContext<"static">>} next
 * @returns {Promise<Response>}
 */
export async function forceGenerateStaticPage(context, next) {
	const cookies = http.getCookies(context.request.headers);
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
		http.setCookie(response.headers, {
			httpOnly: true,
			name: FORCE_GENERATE_COOKIE,
			value: "false",
			expires: new Date(0),
			maxAge: 0,
		});
	}

	return response;
}
