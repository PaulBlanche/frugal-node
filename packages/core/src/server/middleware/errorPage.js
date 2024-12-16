/** @import * as self from "./errorPage.js" */

import { Hash } from "../../utils/Hash.js";
import * as err from "../../utils/error.js";
import { appendToBody } from "../utils.js";

/** @type {Record<number, string>} */
const STATUS_TEXT = {
	400: "Bad Request",
	404: "This page could not be found",
	405: "Method Not Allowed",
	500: "Internal Server Error",
};

/** @type {self.errorPage} */
export function errorPage(pages, rootDir) {
	return async (context, next) => {
		try {
			const response = await next(context);

			if (response.status < 400 || response.body !== null) {
				return response;
			}

			const body = pages[response.status] ?? defaultErrorPage(response.status);

			const headers = new Headers(response.headers);
			headers.set("Etag", `W/"${Hash.create().update(body).digest()}"`);
			headers.set("Content-Type", "text/html; charset=utf-8");

			return new Response(body, {
				status: response.status,
				statusText: response.statusText,
				headers: headers,
			});
		} catch (error) {
			context.log(/** @type {any} */ (error), {
				scope: "error",
				level: "error",
			});

			const normalizedError = err.normalize(error, rootDir);

			const body = pages[500] ?? defaultErrorPage(500, _standardErrorHtml(normalizedError));

			const headers = new Headers();
			headers.set("Etag", `W/"${Hash.create().update(body).digest()}"`);
			headers.set("Content-Type", "text/html; charset=utf-8");

			return new Response(injectErrorScript(body, _standardErrorMessage(normalizedError)), {
				status: 500,
				statusText: STATUS_TEXT[500],
				headers: headers,
			});
		}
	};
}

/**
 * @param {string} document
 * @param {string} errorMessage
 */
function injectErrorScript(document, errorMessage) {
	return appendToBody(
		document,
		`<script>console.error(${JSON.stringify(`Unhandled server side error\n${errorMessage}`)})</script>`,
	);
}

/**
 * @param {err.NormalizedErrror} error
 */
function _standardErrorMessage(error) {
	const messageLineBuffer = [error.name];
	if (error.message) {
		messageLineBuffer.push(`: ${error.message}`);
	}

	const fullBuffer = [messageLineBuffer.join("")];
	if (error.stack) {
		for (const frame of error.stack) {
			const stackLineBuffer = ["    at"];
			if (frame.name) {
				stackLineBuffer.push(frame.name);
			}
			if (frame.location.type === "native") {
				stackLineBuffer.push("(native)");
			} else {
				stackLineBuffer.push(
					`(${frame.location.file}:${frame.location.line}:${frame.location.col})`,
				);
			}
			fullBuffer.push(stackLineBuffer.join(" "));
		}
	}
	if (error.cause) {
		fullBuffer.push(`  [cause]: ${_standardErrorMessage(error.cause)}`);
	}

	return fullBuffer.join("\n");
}

/**
 * @param {err.NormalizedErrror} error
 */
function _standardErrorHtml(error) {
	const messageLineBuffer = [error.name];
	if (error.message) {
		messageLineBuffer.push(`: ${error.message}`);
	}

	const fullBuffer = [
		'<span class="error">',
		`<span class="error-message">${messageLineBuffer.join("")}</span>`,
	];
	if (error.stack) {
		fullBuffer.push('<span class="error-stack">');
		for (const frame of error.stack) {
			fullBuffer.push('<span class="error-frame">');
			const stackLineBuffer = ['<span class="error-frame-at">at</span>'];
			if (frame.name) {
				stackLineBuffer.push(`<span class="error-frame-name">${frame.name}</span>`);
			}
			if (frame.location.type === "native") {
				stackLineBuffer.push('<span class="error-frame-location">(native)</span>');
			} else {
				stackLineBuffer.push(
					`<span class="error-frame-location">(${frame.location.file}:${frame.location.line}:${frame.location.col})</span>`,
				);
			}
			fullBuffer.push(stackLineBuffer.join(" "));
			fullBuffer.push("</span>");
		}
		fullBuffer.push("</span>");
	}
	if (error.cause) {
		fullBuffer.push(`<span class="error-cause">${_standardErrorHtml(error.cause)}</span>`);
	}
	fullBuffer.push("</span>");
	return fullBuffer.join("\n");
}

/**
 * @param {number} status
 * @param {string=} message
 */
function defaultErrorPage(status, message) {
	return `<html lang="en" />
<head>
	<meta charSet="utf-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
</head>
<body>
	${errorHml(status, message)}
</body>
</html>`;
}

/** @type {self.errorHtml} */
export function errorHml(status, message) {
	const statusText = STATUS_TEXT[status] ?? "An unexpected error has occurred";

	return `<style>
	body {
		margin:0;
	}
    .frugal-error-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
		font-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; 
        flex-direction: column;
		height: 100vh;
		width: 100vw;
    }
    .frugal-error-wrapper h1 {
        font-size: 10rem;
        margin: 0;
        font-weight: 200;
		line-height: 1em;
    }
    .frugal-error-wrapper h2 {
        font-weight: 300;
		margin: 0;
    }
	.error-message-wrapper {
		font-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;
		flex-direction: column;
		background: #fff;
		padding: 20px;
		border-top: 5px solid #fff;
		border-top-color: #c30;
		color: #c30;
		white-space: nowrap;
		max-width: calc(100vw - 40px);
		overflow: auto;
		box-sizing: border-box;
		margin: 0 20px;
		box-shadow: 0px 2px 5px #CCC;
	}
	.error {
	  display: inline-block;
	}
	.error-frame {
		color: #c30;
		opacity: 0.5;
	}
	.error-stack {
		text-indent: 4ch;
  		display: flex;
  		flex-direction: column;
  		margin-bottom: 1ch;
	}
	.error-stack:not(:hover) .error-frame:first-child {
		opacity: 1;
	}
	.error-stack:hover .error-frame:hover {
		opacity: 1;
	}
	.error-cause {
		text-indent: 2ch;
		display: flex;
		flex-direction: column;		
	}
	.error-cause .error-message::before {
		content: "[cause]: ";
		font-weight: normal;
	}
	.error-message {
		font-weight: bold;
	}
	.status {
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
		padding: 60px;
	}
</style>
<div class="frugal-error-wrapper">
	<div class="status">
		<h2>${statusText}</h2>
		<h1>${status}</h1>
	</div>
	${message === undefined ? "" : `\n<div class="error-message-wrapper">${message}</div>`}
</div>`;
}
