/** @import * as self from "./staticFile.js" */

import { send } from "../../../utils/send.js";
import { compress } from "../compress.js";

const ONE_YEAR_IN_SECONDS = 31536000;

/** @type {self.staticFile} */
export function staticFile({ rootDir }) {
	return async (context, next) => {
		const sendResponse = await send(context.request, {
			rootDir,
			compressionExt: (context.compress?.encodings ?? []).filter(
				(encoding) => encoding === "gzip" || encoding === "br",
			),
		});

		if (sendResponse === undefined) {
			return next(context);
		}

		if (!sendResponse.ok) {
			return sendResponse;
		}

		const headers = new Headers(sendResponse.headers);
		headers.set("Cache-Control", `public, max-age=${ONE_YEAR_IN_SECONDS}, immutable`);

		const response = new Response(sendResponse.body, {
			headers,
			status: sendResponse.status,
			statusText: sendResponse.statusText,
		});

		return compress(context, response);
	};
}
