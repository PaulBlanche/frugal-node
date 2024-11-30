/** @import * as self from "./watchStaticPage.js" */

import { compress } from "../compress.js";

/** @type {self.watchStaticPage} */
export async function watchStaticPage(context, next) {
	if (context.request.method !== "GET") {
		return next(context);
	}

	if (!context.watch) {
		return next(context);
	}

	context.log("Rebuild static page for watch mode", {
		scope: "serveStaticPage",
		level: "debug",
	});

	const cachedResponse = await context.cache?.get(context.request.url);

	const response = await context.internal(context, {
		type: "static",
		op: "serve",
		index: context.index,
		params: context.params,
	});
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

	return compressedResponse;
}
