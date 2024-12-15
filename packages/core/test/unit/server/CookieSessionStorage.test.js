import * as assert from "node:assert/strict";
import { test } from "node:test";
import { CookieSessionStorage } from "../../../src/server/session/CookieSessionStorage.js";

test("unit/server/CookieSessionStorage: create with default cookie", () => {
	const storage = CookieSessionStorage.create();

	const sessionData = { foo: "bar" };
	const now = Date.now();

	const headers = new Headers();
	const id = storage.create(sessionData, { headers, expires: now });

	assert.deepEqual(id, "cookie");
	assert.deepEqual(Array.from(headers.entries()), [
		[
			"set-cookie",
			`__frugal_session_storage=${encodeURIComponent(JSON.stringify(sessionData))}; Expires=${new Date(now).toUTCString()}`,
		],
	]);
});

test("unit/server/CookieSessionStorage: create with custom cookie", () => {
	const storage = CookieSessionStorage.create({
		name: "my_cookie",
		httpOnly: true,
		path: "/foo",
	});

	const sessionData = { foo: "bar" };
	const now = Date.now();

	const headers = new Headers();
	const id = storage.create(sessionData, { headers, expires: now });

	assert.deepEqual(id, "cookie");
	assert.deepEqual(Array.from(headers.entries()), [
		[
			"set-cookie",
			`my_cookie=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/foo; Expires=${new Date(now).toUTCString()}; HttpOnly`,
		],
	]);
});

test("unit/server/CookieSessionStorage: get", () => {
	const storage = CookieSessionStorage.create({
		name: "my_cookie",
	});

	const sessionData = { foo: "bar" };

	const headers = new Headers([
		["Cookie", `my_cookie=${encodeURIComponent(JSON.stringify(sessionData))}; `],
	]);

	assert.deepEqual(storage.get("cookie", { headers }), sessionData);
});

test("unit/server/CookieSessionStorage: update", () => {
	const storage = CookieSessionStorage.create({
		name: "my_cookie",
		httpOnly: true,
		path: "/foo",
	});

	const headers = new Headers();

	const sessionData = { baz: "quux" };
	const now = Date.now();

	storage.update("cookie", sessionData, { headers, expires: now });

	assert.deepEqual(Array.from(headers.entries()), [
		[
			"set-cookie",
			`my_cookie=${encodeURIComponent(JSON.stringify(sessionData))}; Path=/foo; Expires=${new Date(now).toUTCString()}; HttpOnly`,
		],
	]);
});

test("unit/server/CookieSessionStorage: delete", () => {
	const storage = CookieSessionStorage.create({
		name: "my_cookie",
		httpOnly: true,
		path: "/foo",
	});

	const headers = new Headers();

	storage.delete("cookie", { headers });

	assert.deepEqual(Array.from(headers.entries()), [
		[
			"set-cookie",
			`my_cookie=; Max-Age=0; Path=/foo; Expires=${new Date(0).toUTCString()}; HttpOnly`,
		],
	]);
});
