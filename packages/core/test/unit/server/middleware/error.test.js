/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { test } from "node:test";
import { error } from "../../../../src/server/middleware/error.js";
import * as fixtures from "./fixtures.js";

test("unit/server/error: skip if ok", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 200 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/error: skip if not ok with body", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response("not found", { status: 404 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/error: default 400 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 400 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"LA6EGN"'],
	]);
	assert.deepEqual(
		await response.text(),
		'<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n    .frugal-error-wrapper {\n        position: absolute;\n        inset: 0;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-family: "Sofia sans condensed", sans-serif;\n        flex-direction: column;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n    }\n</style>\n<div class="frugal-error-wrapper">\n    <h1>400</h1>\n    <h2>Bad Request</h2>\n</div>\n</body>\n</html>',
	);
});

test("unit/server/error: default 404 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 404 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"1PTVS99"'],
	]);
	assert.deepEqual(
		await response.text(),
		'<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n    .frugal-error-wrapper {\n        position: absolute;\n        inset: 0;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-family: "Sofia sans condensed", sans-serif;\n        flex-direction: column;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n    }\n</style>\n<div class="frugal-error-wrapper">\n    <h1>404</h1>\n    <h2>This page could not be found</h2>\n</div>\n</body>\n</html>',
	);
});

test("unit/server/error: default 405 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 405 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"2ENATF"'],
	]);
	assert.deepEqual(
		await response.text(),
		'<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n    .frugal-error-wrapper {\n        position: absolute;\n        inset: 0;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-family: "Sofia sans condensed", sans-serif;\n        flex-direction: column;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n    }\n</style>\n<div class="frugal-error-wrapper">\n    <h1>405</h1>\n    <h2>Method Not Allowed</h2>\n</div>\n</body>\n</html>',
	);
});

test("unit/server/error: default 500 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 500 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"LMFZ35"'],
	]);
	assert.deepEqual(
		await response.text(),
		'<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n    .frugal-error-wrapper {\n        position: absolute;\n        inset: 0;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-family: "Sofia sans condensed", sans-serif;\n        flex-direction: column;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n    }\n</style>\n<div class="frugal-error-wrapper">\n    <h1>500</h1>\n    <h2>Internal Server Error</h2>\n</div>\n</body>\n</html>',
	);
});

test("unit/server/error: default base error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 504 });

	const response = await error({})(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"6J7P98"'],
	]);
	assert.deepEqual(
		await response.text(),
		'<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n    .frugal-error-wrapper {\n        position: absolute;\n        inset: 0;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-family: "Sofia sans condensed", sans-serif;\n        flex-direction: column;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n    }\n</style>\n<div class="frugal-error-wrapper">\n    <h1>504</h1>\n    <h2>An unexpected error has occurred</h2>\n</div>\n</body>\n</html>',
	);
});

test("unit/server/error: custom error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse400 = new Response(null, { status: 400 });
	const nextResponse404 = new Response(null, { status: 404 });
	const nextResponse502 = new Response(null, { status: 502 });

	const pages = {
		404: "404 error page content",
		502: "502 error page content",
	};

	const response400 = await error(pages)(context, () => Promise.resolve(nextResponse400));

	assert.notStrictEqual(response400, nextResponse400);
	assert.deepEqual(Array.from(response400.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"LA6EGN"'],
	]);
	assert.deepEqual(
		await response400.text(),
		'<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n    .frugal-error-wrapper {\n        position: absolute;\n        inset: 0;\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        font-family: "Sofia sans condensed", sans-serif;\n        flex-direction: column;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n    }\n</style>\n<div class="frugal-error-wrapper">\n    <h1>400</h1>\n    <h2>Bad Request</h2>\n</div>\n</body>\n</html>',
	);

	const response404 = await error(pages)(context, () => Promise.resolve(nextResponse404));

	assert.notStrictEqual(response404, nextResponse404);
	assert.deepEqual(Array.from(response404.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"LZ0HWM"'],
	]);
	assert.deepEqual(await response404.text(), "404 error page content");

	const response502 = await error(pages)(context, () => Promise.resolve(nextResponse502));

	assert.notStrictEqual(response502, nextResponse502);
	assert.deepEqual(Array.from(response502.headers.entries()), [
		["content-type", "text/plain;charset=UTF-8"],
		["etag", 'W/"G6NY54"'],
	]);
	assert.deepEqual(await response502.text(), "502 error page content");
});
