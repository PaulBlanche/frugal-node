import * as assert from "node:assert/strict";
import { test } from "node:test";

import * as cookies from "../../../../packages/frugal/src/utils/cookies.js";

test("unit/frugal/unit/frugal/utils/http/cookies.js.js: set cookie", () => {
	const headers = new Headers();
	headers.set("Set-Cookie", "foo=bar");

	cookies.setCookie(headers, { name: "foo2", value: "bar2" });
	cookies.setCookie(headers, { name: "foo3", value: "bar3" });
	cookies.setCookie(headers, { name: "foo2", value: "bar4", expires: 100 });

	assert.deepEqual(headers.getSetCookie(), [
		"foo=bar",
		"foo2=bar2",
		"foo3=bar3",
		"foo2=bar4; Expires=Thu, 01 Jan 1970 00:00:00 GMT",
	]);
});

test("unit/frugal/utils/http/cookies.js: get cookie", () => {
	const headers = new Headers();
	headers.set("Cookie", "foo=bar; foo2=bar2; foo3=bar3");

	assert.deepEqual(cookies.getCookies(headers), {
		foo: "bar",
		foo2: "bar2",
		foo3: "bar3",
	});
});

test("unit/frugal/utils/http/cookies.js: get cookie empty", () => {
	const headers = new Headers();

	assert.deepEqual(cookies.getCookies(headers), {});
});
