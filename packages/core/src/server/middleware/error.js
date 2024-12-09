/** @import * as self from "./error.js" */

import { Hash } from "../../utils/Hash.js";

/** @type {Record<number, string>} */
const STATUS_TEXT = {
	400: "Bad Request",
	404: "This page could not be found",
	405: "Method Not Allowed",
	500: "Internal Server Error",
};

/** @type {self.error} */
export function error(pages) {
	return async (context, next) => {
		const response = await next(context);

		if (response.ok || response.body !== null) {
			return response;
		}

		const body = pages[response.status] ?? defaultErrorPage(response.status);

		const headers = new Headers(response.headers);
		headers.set("Content-Type", "text/html; charset=utf-8");
		headers.set("Etag", `W/"${Hash.create().update(body).digest()}"`);

		return new Response(body, {
			status: response.status,
			statusText: response.statusText,
			headers: headers,
		});
	};
}

/**
 * @param {number} status
 */
function defaultErrorPage(status) {
	return `<html lang="en" />
<head>
	<meta charSet="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
	${errorHml(status)}
</body>
</html>`;
}

/** @type {self.errorHtml} */
export function errorHml(status) {
	const statusText = STATUS_TEXT[status] ?? "An unexpected error has occurred";

	return `<style>
    .frugal-error-wrapper {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: "Sofia sans condensed", sans-serif;
        flex-direction: column;
    }
    .frugal-error-wrapper h1 {
        font-size: 10rem;
        margin: 0;
        font-weight: 200;
    }
    .frugal-error-wrapper h2 {
        font-weight: 300;
    }
</style>
<div class="frugal-error-wrapper">
    <h1>${status}</h1>
    <h2>${statusText}</h2>
</div>`;
}
