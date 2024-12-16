/** @import { RouterContext } from "../../../../src/server/middleware/router.js" */
/** @import { Next } from "../../../../src/server/middleware.js" */
/** @import { Producer } from "../../../../src/page/Producer.js";*/
/** @import { ServerCache } from "../../../../src/server/ServerCache.js"; */
/** @import { FrugalResponse } from "../../../../src/page/FrugalResponse.js"; */

import * as assert from "node:assert/strict";
import { test } from "node:test";
import { errorPage } from "../../../../src/server/middleware/errorPage.js";
import * as fixtures from "./fixtures.js";

test("unit/server/errorPage: skip if ok", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 200 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/errorPage: skip if not ok with body", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response("not found", { status: 404 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.strictEqual(response, nextResponse);
});

test("unit/server/errorPage: default 400 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 400 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"162G896"'],
	]);
	assert.deepEqual(
		await response.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>Bad Request</h2>\n\t\t<h1>400</h1>\n\t</div>\n\t\n</div>\n</body>\n</html>`,
	);
});

test("unit/server/errorPage: default 404 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 404 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"HBQZD2"'],
	]);
	assert.deepEqual(
		await response.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>This page could not be found</h2>\n\t\t<h1>404</h1>\n\t</div>\n\t\n</div>\n</body>\n</html>`,
	);
});

test("unit/server/errorPage: default 405 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 405 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"18E86QP"'],
	]);
	assert.deepEqual(
		await response.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>Method Not Allowed</h2>\n\t\t<h1>405</h1>\n\t</div>\n\t\n</div>\n</body>\n</html>`,
	);
});

test("unit/server/errorPage: default 500 error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 500 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"GV7WYI"'],
	]);
	assert.deepEqual(
		await response.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>Internal Server Error</h2>\n\t\t<h1>500</h1>\n\t</div>\n\t\n</div>\n</body>\n</html>`,
	);
});

test("unit/server/errorPage: default base error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse = new Response(null, { status: 504 });

	const response = await errorPage({}, "/")(context, () => Promise.resolve(nextResponse));

	assert.notStrictEqual(response, nextResponse);
	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"MCZWR"'],
	]);
	assert.deepEqual(
		await response.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>An unexpected error has occurred</h2>\n\t\t<h1>504</h1>\n\t</div>\n\t\n</div>\n</body>\n</html>`,
	);
});

test("unit/server/errorPage: custom error page", async () => {
	const context = fixtures.makeRouterContext({});
	const nextResponse400 = new Response(null, { status: 400 });
	const nextResponse404 = new Response(null, { status: 404 });
	const nextResponse502 = new Response(null, { status: 502 });

	const pages = {
		404: "404 error page content",
		502: "502 error page content",
	};

	const response400 = await errorPage(pages, "/")(context, () =>
		Promise.resolve(nextResponse400),
	);

	assert.notStrictEqual(response400, nextResponse400);
	assert.deepEqual(Array.from(response400.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"162G896"'],
	]);
	assert.deepEqual(
		await response400.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>Bad Request</h2>\n\t\t<h1>400</h1>\n\t</div>\n\t\n</div>\n</body>\n</html>`,
	);

	const response404 = await errorPage(pages, "/")(context, () =>
		Promise.resolve(nextResponse404),
	);

	assert.notStrictEqual(response404, nextResponse404);
	assert.deepEqual(Array.from(response404.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"LZ0HWM"'],
	]);
	assert.deepEqual(await response404.text(), "404 error page content");

	const response502 = await errorPage(pages, "/")(context, () =>
		Promise.resolve(nextResponse502),
	);

	assert.notStrictEqual(response502, nextResponse502);
	assert.deepEqual(Array.from(response502.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"G6NY54"'],
	]);
	assert.deepEqual(await response502.text(), "502 error page content");
});

test("unit/server/errorPage: unhandled error page", async () => {
	const context = fixtures.makeRouterContext({});

	const response = await errorPage({}, import.meta.dirname)(context, () => {
		throw new Error("error");
	});

	assert.deepEqual(Array.from(response.headers.entries()), [
		["content-type", "text/html; charset=utf-8"],
		["etag", 'W/"FWSYOI"'],
	]);
	assert.deepEqual(
		await response.text(),
		`<html lang="en" />\n<head>\n\t<meta charSet="utf-8" />\n\t<meta name="viewport" content="width=device-width, initial-scale=1" />\n\t<link rel="icon" type="image/svg+xml" href="/favicon.svg" />\n</head>\n<body>\n\t<style>\n\tbody {\n\t\tmargin:0;\n\t}\n    .frugal-error-wrapper {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n\t\tfont-family: Avenir, Montserrat, Corbel, 'URW Gothic', source-sans-pro, sans-serif; \n        flex-direction: column;\n\t\theight: 100vh;\n\t\twidth: 100vw;\n    }\n    .frugal-error-wrapper h1 {\n        font-size: 10rem;\n        margin: 0;\n        font-weight: 200;\n\t\tline-height: 1em;\n    }\n    .frugal-error-wrapper h2 {\n        font-weight: 300;\n\t\tmargin: 0;\n    }\n\t.error-message-wrapper {\n\t\tfont-family: ui-monospace, 'Cascadia Code', 'Source Code Pro', Menlo, Consolas, 'DejaVu Sans Mono', monospace;\n\t\tflex-direction: column;\n\t\tbackground: #fff;\n\t\tpadding: 20px;\n\t\tborder-top: 5px solid #fff;\n\t\tborder-top-color: #c30;\n\t\tcolor: #c30;\n\t\twhite-space: nowrap;\n\t\tmax-width: calc(100vw - 40px);\n\t\toverflow: auto;\n\t\tbox-sizing: border-box;\n\t\tmargin: 0 20px;\n\t\tbox-shadow: 0px 2px 5px #CCC;\n\t}\n\t.error {\n\t  display: inline-block;\n\t}\n\t.error-frame {\n\t\tcolor: #c30;\n\t\topacity: 0.5;\n\t}\n\t.error-stack {\n\t\ttext-indent: 4ch;\n  \t\tdisplay: flex;\n  \t\tflex-direction: column;\n  \t\tmargin-bottom: 1ch;\n\t}\n\t.error-stack:not(:hover) .error-frame:first-child {\n\t\topacity: 1;\n\t}\n\t.error-stack:hover .error-frame:hover {\n\t\topacity: 1;\n\t}\n\t.error-cause {\n\t\ttext-indent: 2ch;\n\t\tdisplay: flex;\n\t\tflex-direction: column;\t\t\n\t}\n\t.error-cause .error-message::before {\n\t\tcontent: "[cause]: ";\n\t\tfont-weight: normal;\n\t}\n\t.error-message {\n\t\tfont-weight: bold;\n\t}\n\t.status {\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        flex-direction: column;\n\t\tpadding: 60px;\n\t}\n</style>\n<div class="frugal-error-wrapper">\n\t<div class="status">\n\t\t<h2>Internal Server Error</h2>\n\t\t<h1>500</h1>\n\t</div>\n\t\n<div class="error-message-wrapper"><span class="error">\n<span class="error-message">Error: error</span>\n<span class="error-stack">\n<span class="error-frame">\n<span class="error-frame-at">at</span> <span class="error-frame-name">TestContext.&lt;anonymous&gt;</span> <span class="error-frame-location">(errorPage.test.js:166:59)</span>\n</span>\n</span>\n</span></div>\n</div>\n<script>console.error("Unhandled server side error\\nError: error\\n    at TestContext.&lt;anonymous&gt; (errorPage.test.js:166:59)")</script></body>\n</html>`,
	);
});
