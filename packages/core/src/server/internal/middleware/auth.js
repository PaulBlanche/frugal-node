/** @import * as self from "./auth.js" */

import { parseToken } from "../../../utils/crypto.js";

/** @type {self.auth} */
export function auth() {
	return async (context, next) => {
		const token = context.request.headers.get("x-frugal-token");

		if (token !== null) {
			const parsed = await parseToken(context.cryptoKey, token);

			if (parsed !== undefined) {
				return next({ ...context, state: { ...context.state, _frugal_type: parsed["t"] } });
			}
		}

		context.log("Invalid x-frugal-token header : 401", {
			level: "debug",
			scope: "auth",
		});

		return new Response(null, { status: 401 });
	};
}
