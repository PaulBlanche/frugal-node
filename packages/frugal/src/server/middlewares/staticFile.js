/** @import * as self from "./staticFile.js" */

import { send } from "../../utils/send.js";

const ONE_YEAR_IN_SECONDS = 31536000;

/** @type {self.staticFile} */
export async function staticFile(context, next) {
	if (context.config.publicDir === undefined) {
		return next(context);
	}

	const response = await send(context.request, { rootDir: context.config.publicDir });

	if (!response.ok) {
		return response;
	}

	const headers = new Headers(response.headers);
	headers.set("Cache-Control", `max-age=${ONE_YEAR_IN_SECONDS}, immutable`);

	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText,
	});
}
