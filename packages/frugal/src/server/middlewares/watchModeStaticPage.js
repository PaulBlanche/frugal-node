import { toResponse } from "../../page/GenerationResponse.js";

/** @type {import('./watchModeStaticPage.ts').watchModeStaticPage} */
export async function watchModeStaticPage(context, next) {
	if (!context.watch) {
		return next(context);
	}

	const cachedResponse = await context.cache.get(context.url.pathname);

	if (context.page.strictPaths && cachedResponse === undefined) {
		context.log(
			"Path was not generated during build and page do not allow JIT generation. Yield.",
			{
				level: "debug",
				scope: "watchModeStaticPage",
			},
		);

		return next(context);
	}

	context.log("Refreshing static page for dev mode", {
		level: "debug",
		scope: "watchModeStaticPage",
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

	await context.cache.add(generationResponse);

	const response = toResponse(generationResponse);

	const generationDate = cachedResponse?.headers.get("X-Frugal-Generation-Date") ?? undefined;
	if (generationDate) {
		response.headers.set("X-Frugal-Generation-Date", generationDate);
	}

	return response;
}
