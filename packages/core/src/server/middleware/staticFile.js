/** @import * as self from "./staticFile.js" */

import { send } from "../../utils/send.js";

const ONE_YEAR_IN_SECONDS = 31536000;

/** @type {self.staticFile} */
export function staticFile({ rootDir }) {
	return async (context, next) => {
		if (rootDir === undefined) {
			return next(context);
		}

		const sendResponse = await send(context.request, {
			rootDir,
			compressionExt: (context.compress?.encodings ?? []).filter(
				(encoding) => encoding === "gzip" || encoding === "br",
			),
		});

		if (sendResponse === undefined) {
			context.log("No static file found. Yield.", {
				scope: "staticFile",
				level: "debug",
			});

			return next(context);
		}

		if (!sendResponse.ok) {
			context.log(`Error while serving static file "${context.url.pathname}".`, {
				scope: "staticFile",
				level: "debug",
			});

			return sendResponse;
		}

		context.log(`Serving static file "${context.url.pathname}".`, {
			scope: "staticFile",
			level: "debug",
		});

		const headers = new Headers(sendResponse.headers);
		headers.set("Cache-Control", `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`);

		return new Response(sendResponse.body, {
			headers,
			status: sendResponse.status,
			statusText: sendResponse.statusText,
		});
	};
}
