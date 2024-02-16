import { verify } from "../../utils/crypto.js";
import * as context from "../context.js";
import * as middleware from "../middleware.js";

/**
 * @param {context.RouteContext<"static">} context
 * @param {middleware.Next<context.RouteContext<"static">>} next
 * @returns {Promise<Response>}
 */
export async function refreshStaticPage(context, next) {
	const cryptoKey = context.config.server.cryptoKey;
	if (cryptoKey === undefined) {
		context.log("no crypto key in config. Yield.", {
			level: "debug",
			scope: "refreshStaticPage",
		});

		return next(context);
	}

	if (context.request.method !== "GET") {
		return next(context);
	}

	const url = new URL(context.request.url);
	const timestamp = url.searchParams.get("timestamp");
	const signature = url.searchParams.get("sign");

	if (!timestamp || !signature) {
		context.log("Missing parameters for force refresh. Yield.", {
			level: "debug",
			scope: "refreshStaticPage",
		});

		return next(context);
	}

	const delta = Math.abs(Date.now() - Number(timestamp));

	if (delta > 10 * 1000) {
		context.log("Request has expired timestamp. Yield.", {
			level: "debug",
			scope: "refreshStaticPage",
		});

		return next(context);
	}

	const verified = await verify(cryptoKey, signature, timestamp);

	if (!verified) {
		context.log("Request has invalid signature. Yield.", {
			level: "debug",
			scope: "refreshStaticPage",
		});

		return next(context);
	}

	const generationResponse = await context.producer.refresh(context.params);

	if (generationResponse === undefined) {
		return next(context);
	}

	await context.cache.add(generationResponse);

	const redirectionUrl = new URL(url);

	return new Response(null, {
		status: 303, // see other
		headers: {
			Location: redirectionUrl.pathname,
		},
	});
}
