import type { BaseContext, Next } from "@frugal-node/core/server";
import { TOC, latest } from "../data/doc/toc.ts";

export function docLatestRewrite(context: BaseContext, next: Next<BaseContext>) {
	const matches = context.request.url.match(/\/doc@latest(?:\/(.*))?$/);
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
