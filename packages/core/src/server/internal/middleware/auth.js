/** @import * as self from "./auth.js" */

import { parseToken } from "../../../utils/crypto.js";
import { composeMiddleware } from "../../middleware.js";

/** @type {self.auth} */
export function auth(middlewares) {
	const middleware = composeMiddleware(middlewares);

	return async (context, next) => {
		const token = context.url.searchParams.get("token");

		if (token !== null) {
			const parsed = await parseToken(context.cryptoKey, token);

			if (parsed !== undefined) {
				const extraContext = parseExtraContext(parsed);
				const originalUrl = parsed["url"];

				if (extraContext !== undefined) {
					return middleware(
						{
							...context,
							...extraContext,
							request: new Request(originalUrl, context.request),
							url: new URL(originalUrl),
						},
						next,
					);
				}
			}
		}

		context.log("Invalid x-frugal-token header : 401", {
			level: "debug",
			scope: "auth",
		});

		return new Response(null, { status: 401 });
	};
}

/**
 * @param {Record<string, string>} parsed
 * @returns {self.ExtraContext|undefined}
 */
function parseExtraContext(parsed) {
	try {
		const index = Number(parsed["index"]);
		const type = parsed["type"];
		const op = parsed["op"];
		const params = JSON.parse(parsed["params"]);

		if (Number.isNaN(index)) {
			return undefined;
		}

		if (type === "dynamic") {
			return { index, type, params };
		}

		if (type !== "static") {
			return undefined;
		}

		if (op === "generate" || op === "refresh" || op === "serve") {
			return { index, type, op, params };
		}

		return undefined;
	} catch {
		return undefined;
	}
}
