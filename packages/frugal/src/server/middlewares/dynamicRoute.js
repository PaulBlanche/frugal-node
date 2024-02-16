import { toResponse } from "../../page/GenerationResponse.js";
import * as context from "../context.js";
import * as middleware from "../middleware.js";

/**
 * @param {context.RouteContext<"dynamic">} context
 * @param {middleware.Next<context.RouteContext<"dynamic">>} next
 */
export async function dynamicRoute(context, next) {
	context.log("Generation of dynamic page", { level: "debug", scope: "dynamicRoute" });

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

	return toResponse(generationResponse);
}
