/** @import * as self from "./serveStaticPage.js" */

import { compress } from "../compress.js";

/** @type {self.serveStaticPage} */
export async function serveStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (context.cache) {
		const response = await context.cache.get(context.request.url);
		if (response !== undefined) {
			context.log("Serve static page from cache.", {
				scope: "serveStaticPage",
				level: "debug",
			});

			return response;
		}
	}

	context.log("JIT build static page.", {
		scope: "serveStaticPage",
		level: "debug",
	});

	const response = await context.internal(context, {
		type: "static",
		op: "serve",
		index: context.index,
		params: context.params,
	});
	const compressedResponse = compress(context, response);

	if (context.cache) {
		await context.cache.add(context.request.url, compressedResponse.clone());
	}

	compressedResponse.headers.delete("x-frugal-build-hash");

	return compressedResponse;
}
