import type { Context, Next } from "@frugal-node/core/server";
import { TOC, latest } from "../data/doc/toc.ts";

const LATEST_REGEXP = /\/doc@latest(?:\/(.*))?$/;

export function docLatestRewrite(context: Context, next: Next<Context>) {
	const matches = context.request.url.match(LATEST_REGEXP);
	if (matches) {
		const redirectUrl = context.request.url.replace("/doc@latest", `/en/doc@${latest(TOC)}`);
		return new Response(undefined, {
			status: 307,
			headers: {
				Location: redirectUrl,
			},
		});
	}

	return next(context);
}
