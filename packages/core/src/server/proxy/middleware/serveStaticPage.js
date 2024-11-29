/** @import * as self from "./serveStaticPage.js" */

import { compress } from "../compress.js";

/** @type {self.serveStaticPage} */
export async function serveStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (context.watch) {
		context.log("Rebuild static page for watch mode", {
			scope: "serveStaticPage",
			level: "debug",
		});

		const cachedResponse = await context.cache?.get(context.request.url);

		const response = await context.internal(context, "serve");
		const compressedResponse = compress(context, response);

		if (
			cachedResponse &&
			response.headers.get("x-frugal-build-hash") !==
				cachedResponse.headers.get("x-frugal-build-hash")
		) {
			await context.cache?.add(context.request.url, compressedResponse.clone());
		}

		const generationDate = cachedResponse?.headers.get("X-Frugal-Generation-Date") ?? undefined;
		if (generationDate) {
			compressedResponse.headers.set("X-Frugal-Generation-Date", generationDate);
		}

		compressedResponse.headers.delete("x-frugal-build-hash");

		return compressedResponse;
	}

	if (context.cache) {
		const response = await context.cache.get(context.request.url);
		if (response !== undefined) {
			context.log("Serve static page from cache.", {
				scope: "serveStaticPage",
				level: "debug",
			});

			response.headers.delete("x-frugal-build-hash");

			return response;
		}
	}

	context.log("JIT build static page.", {
		scope: "serveStaticPage",
		level: "debug",
	});

	const response = await context.internal(context, "serve");
	const compressedResponse = compress(context, response);

	if (context.cache) {
		await context.cache.add(context.request.url, compressedResponse.clone());
	}

	compressedResponse.headers.delete("x-frugal-build-hash");

	return compressedResponse;
}
