import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import { mock, test } from "node:test";
import * as url from "node:url";
import { BuildHelper, ServerHelper } from "@frugal-node/test-utils";
import { crypto, CookieSessionStorage } from "../../../exports/server/index.js";
import { FORCE_REFRESH_HEADER } from "../../../src/page/FrugalResponse.js";
import { forceRefreshToken } from "../../../src/utils/crypto.js";

const helper = await BuildHelper.setupFixtures(import.meta.dirname);
const serverHelper = new ServerHelper(helper.runtimeConfig, helper.internalBuildConfig);

const now = Math.floor(Math.random() * 1000 * 60 * 60 * 24 * 365 * 10);
mock.timers.enable({ apis: ["Date"], now });

await helper.build();

await serverHelper.withServer(async () => {
	await test("inte/server: serving basic static page without jit", async () => {
		const response = await fetch("http://localhost:8000/static/1");

		assert.strictEqual(response.headers.get("content-type"), "application/json");
		const body = await response.json();
		assert.deepEqual(body, {
			params: { slug: "1" },
			count: 0,
			store: "foo",
			searchParams: {},
		});
	});

	await test("inte/server: serving basic static page with jit", async () => {
		const response = await fetch("http://localhost:8000/static-jit/5");

		assert.strictEqual(response.headers.get("content-type"), "application/json");
		const body = await response.json();
		assert.deepEqual(body, {
			params: { slug: "5" },
			count: 0,
			searchParams: {},
		});
	});

	await test("inte/server: serving basic static page with invalid jit", async () => {
		const response = await fetch("http://localhost:8000/static/5");

		assert.strictEqual(response.status, 404);
	});

	await test("inte/server: serving basic static page with force refresh", async () => {
		const token = await forceRefreshToken(
			await crypto.importKey(
				"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
			),
		);

		// modify data.json but only data used by page1/1
		const dataURL = import.meta.resolve("./project/data.json");
		const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
			encoding: "utf-8",
		});
		await fs.promises.writeFile(url.fileURLToPath(dataURL), '"bar"', {
			encoding: "utf-8",
		});

		const response = await fetch("http://localhost:8000/static/1", {
			redirect: "manual",
			headers: {
				[FORCE_REFRESH_HEADER]: token,
			},
		});

		assert.strictEqual(response.status, 307);
		assert.strictEqual(response.headers.get("location"), "/static/1");
		const revalidatedResponse = await fetch("http://localhost:8000/static/1");

		assert.strictEqual(revalidatedResponse.headers.get("content-type"), "application/json");
		const body = await revalidatedResponse.json();
		assert.deepEqual(body, {
			params: { slug: "1" },
			count: 0,
			store: "bar",
			searchParams: {},
		});

		await fs.promises.writeFile(url.fileURLToPath(dataURL), originalData, {
			encoding: "utf-8",
		});
	});

	await test("inte/server: fail force refresh (timestamp too old)", async () => {
		// modify data.json but only data used by page1/1
		const dataURL = import.meta.resolve("./project/data.json");
		const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
			encoding: "utf-8",
		});
		await fs.promises.writeFile(url.fileURLToPath(dataURL), '"foobar"', {
			encoding: "utf-8",
		});

		const token = await forceRefreshToken(
			await crypto.importKey(
				"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
			),
		);

		mock.timers.tick(10 * 1000 + 1);

		const response = await fetch("http://localhost:8000/static/1", {
			headers: {
				[FORCE_REFRESH_HEADER]: token,
			},
		});

		assert.strictEqual(response.headers.get("content-type"), "application/json");
		const body = await response.json();
		assert.deepEqual(body, {
			params: { slug: "1" },
			count: 0,
			store: "bar",
			searchParams: {},
		});

		await fs.promises.writeFile(url.fileURLToPath(dataURL), originalData, {
			encoding: "utf-8",
		});

		mock.timers.setTime(now);
	});

	await test("inte/server: fail force refresh (invalid key)", async () => {
		// modify data.json but only data used by page1/1
		const dataURL = import.meta.resolve("./project/data.json");
		const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
			encoding: "utf-8",
		});
		await fs.promises.writeFile(url.fileURLToPath(dataURL), '"foobar"', {
			encoding: "utf-8",
		});

		const token = await forceRefreshToken(await crypto.importKey(await crypto.exportKey()));

		const response = await fetch("http://localhost:8000/static/1", {
			headers: {
				[FORCE_REFRESH_HEADER]: token,
			},
		});

		assert.strictEqual(response.headers.get("content-type"), "application/json");
		const body = await response.json();
		assert.deepEqual(body, {
			params: { slug: "1" },
			count: 0,
			store: "bar",
			searchParams: {},
		});

		await fs.promises.writeFile(url.fileURLToPath(dataURL), originalData, {
			encoding: "utf-8",
		});
	});

	await test("inte/server: serving basic static page with invalid method", async () => {
		const response = await fetch("http://localhost:8000/static-jit/5", {
			method: "PATCH",
		});

		assert.strictEqual(response.status, 404);
	});

	await test("inte/server: serving basic dynamic page GET", async () => {
		const response = await fetch("http://localhost:8000/dynamic/6");

		const body = await response.json();
		const cookies = response.headers.get("Set-Cookie");

		assert.deepEqual(body, {
			params: { slug: "6" },
			count: 0,
			searchParams: {},
		});

		// emulate browser by sending back cookies from the previous request
		const responseWithParams = await fetch("http://localhost:8000/dynamic/3?foo=bar", {
			headers: { ...(cookies ? { Cookie: cookies } : {}) },
		});

		const bodyWithParams = await responseWithParams.json();

		assert.deepEqual(bodyWithParams, {
			params: { slug: "3" },
			count: 1,
			searchParams: { foo: "bar" },
		});
	});

	await test("inte/server: static page with post/redirect", async () => {
		const response = await fetch("http://localhost:8000/static/1?foo=bar", {
			redirect: "manual",
			method: "POST",
		});

		assert.deepEqual(response.status, 303);
		assert.strictEqual(
			response.headers.get("location"),
			"http://localhost:8000/static/1?foo=bar",
		);
		const cookies = response.headers.getSetCookie();

		// emulate browser by following 303 redirect with a GET and sending back cookies from the previous request
		const redirectResponse = await fetch("http://localhost:8000/static/1?foo=bar", {
			method: "GET",
			headers: {
				...(cookies
					? { Cookie: cookies.map((cookie) => cookie.split(";")[0]).join(";") }
					: {}),
			},
		});

		const body = await redirectResponse.json();

		assert.deepEqual(body, {
			params: { slug: "1" },
			count: 1,
			store: "foo",
			searchParams: { foo: "bar" },
		});
	});

	await test("inte/server: Etag 304", async () => {
		const response = await fetch("http://localhost:8000/static/1");

		const etag = response.headers.get("Etag");

		assert.notDeepEqual(etag, null);

		// simulate browser by sending etag form previous request in If-None-Match header
		const etageResponse = await fetch("http://localhost:8000/static/1", {
			headers: {
				"If-None-Match": etag ?? "",
			},
		});

		assert.strictEqual(etageResponse.status, 304);
	});

	await test("inte/server: static file", async () => {
		const response = await fetch("http://localhost:8000/file.txt");

		const body = await response.text();

		assert.strictEqual(response.status, 200);
		assert.strictEqual(
			response.headers.get("cache-control"),
			"public, max-age=31536000, immutable",
		);
		assert.deepEqual(body, "foo");
	});

	await test("inte/server: timed refresh", async () => {
		const response1 = await fetch("http://localhost:8000/static-revalidate/1");

		const body1 = await response1.json();
		assert.strictEqual(response1.headers.get("content-type"), "application/json");
		assert.deepEqual(body1, {
			params: { slug: "1" },
			count: 0,
			store: "foo",
			searchParams: {},
		});

		// modify data.json but only data used by page1/1
		const dataURL = import.meta.resolve("./project/data.json");
		const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
			encoding: "utf-8",
		});
		await fs.promises.writeFile(url.fileURLToPath(dataURL), '"bar"', {
			encoding: "utf-8",
		});

		mock.timers.tick(2 * 1000);

		const response2 = await fetch("http://localhost:8000/static-revalidate/1");

		if (response2 === null) {
			assert.fail("response should not be null");
		}

		const body2 = await response2.json();
		assert.deepEqual(body2, {
			params: { slug: "1" },
			count: 0,
			store: "foo",
			searchParams: {},
		});

		mock.timers.tick(3 * 1000 + 1);

		const response3 = await fetch("http://localhost:8000/static-revalidate/1");

		if (response3 === null) {
			assert.fail("response should not be null");
		}

		const body3 = await response3.json();
		assert.deepEqual(body3, {
			params: { slug: "1" },
			count: 0,
			store: "bar",
			searchParams: {},
		});

		await fs.promises.writeFile(url.fileURLToPath(dataURL), originalData, {
			encoding: "utf-8",
		});
	});

	await test("inte/server: trailing slash redirect", async () => {
		const response = await fetch("http://localhost:8000/static/1/", {
			redirect: "manual",
		});

		assert.strictEqual(response.status, 301);
		assert.strictEqual(response.headers.get("location"), "/static/1");
	});
});

const helperWithCookieSessionStorage = await serverHelper.extends((config) => ({
	...config,
	session: {
		...config?.session,
		storage: CookieSessionStorage.create(),
	},
}));

await helperWithCookieSessionStorage.withServer(async () => {
	await test("inte/server: session with cookie storage", async () => {
		const response = await fetch("http://localhost:8000/dynamic/6");

		const body = await response.json();

		assert.deepEqual(body, {
			params: { slug: "6" },
			count: 0,
			searchParams: {},
		});

		const cookies1 = response.headers.getSetCookie();
		assert.deepEqual(cookies1, [
			`__frugal_session_storage=${encodeURIComponent(JSON.stringify({ counter: 1 }))}`,
			"__frugal_session=cookie",
		]);

		const responseWithParams = await fetch("http://localhost:8000/dynamic/3?foo=bar", {
			headers: { Cookie: cookies1.join(";") },
		});

		const bodyWithParams = await responseWithParams.json();

		assert.deepEqual(bodyWithParams, {
			params: { slug: "3" },
			count: 1,
			searchParams: { foo: "bar" },
		});

		const cookies2 = responseWithParams.headers.getSetCookie();
		assert.deepEqual(cookies2, [
			`__frugal_session_storage=${encodeURIComponent(JSON.stringify({ counter: 2 }))}`,
			"__frugal_session=cookie",
		]);
	});
});
