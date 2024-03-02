/** @type {import('./trailingSlashRedirect.ts').trailingSlashRedirect} */
export function trailingSlashRedirect(context, next) {
	const url = new URL(context.request.url);
	if (url.pathname.endsWith("/") && url.pathname !== "/") {
		return new Response(undefined, {
			status: 301,
			headers: {
				Location: url.pathname.slice(0, -1),
			},
		});
	}

	return next(context);
}
