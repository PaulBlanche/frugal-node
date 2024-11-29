import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import { test } from "node:test";
import * as url from "node:url";
import { BuildHelper, ServerHelper, puppeteer } from "@frugal-node/test-utils";
import { crypto, CookieSessionStorage } from "../../../exports/server/index.js";
import { token } from "../../../src/utils/crypto.js";

const helper = await BuildHelper.setupFixtures(import.meta.dirname);
const serverHelper = new ServerHelper(helper.runtimeConfig, helper.internalBuildConfig);

await helper.build();

await withServerAndBrowser(serverHelper, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: serving basic static page without jit", async () => {
				const response = await page.goto("http://localhost:8000/static/1");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
				assert.deepEqual(body, {
					params: { slug: "1" },
					count: 0,
					store: "foo",
					searchParams: {},
				});
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: serving basic static page with jit", async () => {
				const response = await page.goto("http://localhost:8000/static-jit/5");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
				assert.deepEqual(body, {
					params: { slug: "5" },
					count: 0,
					searchParams: {},
				});
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: serving basic static page with invalid jit", async () => {
				const response = await page.goto("http://localhost:8000/static/5");

				if (response === null) {
					assert.fail("response should not be null");
				}

				assert.strictEqual(response.status(), 404);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: serving basic static page with force refresh", async () => {
				const refreshToken = await token(
					await crypto.importKey(
						"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
					),
					{ op: "rf" },
				);

				// modify data.json but only data used by page1/1
				const dataURL = import.meta.resolve("./project/data.json");
				const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
					encoding: "utf-8",
				});
				await fs.promises.writeFile(url.fileURLToPath(dataURL), '"bar"', {
					encoding: "utf-8",
				});

				const response = await page.goto(
					`http://localhost:8000/static/1?token=${refreshToken}`,
				);

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
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
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: fail force refresh (timestamp too old)", async (context) => {
				// modify data.json but only data used by page1/1
				const dataURL = import.meta.resolve("./project/data.json");
				const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
					encoding: "utf-8",
				});
				await fs.promises.writeFile(url.fileURLToPath(dataURL), '"foobar"', {
					encoding: "utf-8",
				});

				context.mock.timers.enable({ apis: ["Date"], now: Date.now() });

				const refreshToken = await token(
					await crypto.importKey(
						"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
					),
					{ op: "rf" },
				);

				context.mock.timers.tick(20 * 1000);

				const response = await page.goto(
					`http://localhost:8000/static/1?token=${refreshToken}`,
				);

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
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
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: fail force refresh (invalid key)", async () => {
				// modify data.json but only data used by page1/1
				const dataURL = import.meta.resolve("./project/data.json");
				const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
					encoding: "utf-8",
				});
				await fs.promises.writeFile(url.fileURLToPath(dataURL), '"foobar"', {
					encoding: "utf-8",
				});

				const refreshToken = await token(await crypto.importKey(await crypto.exportKey()), {
					op: "rf",
				});

				const response = await page.goto(
					`http://localhost:8000/static/1?token=${refreshToken}`,
				);

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
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
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: serving basic static page with invalid method", async () => {
				await page.setRequestInterception(true);

				page.on("request", (interceptedRequest) => {
					interceptedRequest.continue({
						method: "PATCH",
					});
				});

				const response = await page.goto("http://localhost:8000/static-jit/5");

				if (response === null) {
					assert.fail("response should not be null");
				}

				assert.strictEqual(response.status(), 404);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: serving basic dynamic page GET", async () => {
				const response = await page.goto("http://localhost:8000/dynamic/6");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.deepEqual(body, {
					params: { slug: "6" },
					count: 0,
					searchParams: {},
				});

				const responseWithParams = await page.goto(
					"http://localhost:8000/dynamic/3?foo=bar",
				);

				if (responseWithParams === null) {
					assert.fail("response should not be null");
				}

				const bodyWithParams = await responseWithParams.json();

				assert.deepEqual(bodyWithParams, {
					params: { slug: "3" },
					count: 1,
					searchParams: { foo: "bar" },
				});
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: static page with post/redirect", async () => {
				await page.setRequestInterception(true);

				page.on("request", (interceptedRequest) => {
					interceptedRequest.continue({
						method: "POST",
					});
				});

				const response = await page.goto("http://localhost:8000/static/1?foo=bar");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.deepEqual(body, {
					params: { slug: "1" },
					count: 1,
					store: "foo",
					searchParams: { foo: "bar" },
				});
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: Etag 304", async () => {
				await page.goto("http://localhost:8000/static/1");

				const response = await page.reload();

				if (response === null) {
					assert.fail("response should not be null");
				}

				assert.strictEqual(response.status(), 304);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: static file", async () => {
				const response = await page.goto("http://localhost:8000/file.txt");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.text();

				assert.strictEqual(response.status(), 200);
				assert.strictEqual(
					response.headers()["cache-control"],
					"public, max-age=31536000, immutable",
				);
				assert.deepEqual(body, "foo");
			});
		},
		{ browser },
	);
});

await withServerAndBrowser(serverHelper, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: trailing slash redirect", async () => {
				const deferred = /** @type {PromiseWithResolvers<void>} */ (
					Promise.withResolvers()
				);

				page.on("response", (response) => {
					if (response.url() === "http://localhost:8000/static/1/") {
						try {
							assert.strictEqual(response.status(), 301);
							assert.strictEqual(response.headers()["location"], "/static/1");
							deferred.resolve();
						} catch (error) {
							deferred.reject(error);
						}
					}
				});

				const response = await page.goto("http://localhost:8000/static/1/");

				if (response === null) {
					assert.fail("response should not be null");
				}

				await deferred.promise;
			});
		},
		{ browser },
	);
});

const helperWithCookieSessionStorage = await serverHelper.extends((config) => ({
	...config,
	session: {
		...config?.session,
		storage: CookieSessionStorage.create(),
	},
}));

await withServerAndBrowser(helperWithCookieSessionStorage, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			await test("inte/server: session with cookie storage", async () => {
				const response = await page.goto("http://localhost:8000/dynamic/6");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.deepEqual(body, {
					params: { slug: "6" },
					count: 0,
					searchParams: {},
				});

				const responseWithParams = await page.goto(
					"http://localhost:8000/dynamic/3?foo=bar",
				);

				if (responseWithParams === null) {
					assert.fail("response should not be null");
				}

				const bodyWithParams = await responseWithParams.json();

				assert.deepEqual(bodyWithParams, {
					params: { slug: "3" },
					count: 1,
					searchParams: { foo: "bar" },
				});

				const cookies = await page.cookies();
				const sessionStorageCookie = cookies.find(
					(cookie) => cookie.name === "__frugal_session_storage",
				);

				if (sessionStorageCookie?.value === undefined) {
					assert.fail("session storage cookie should be present");
				}

				assert.deepEqual(JSON.parse(decodeURIComponent(sessionStorageCookie.value)), {
					counter: 2,
				});
			});
		},
		{ browser },
	);
});

/**
 * @param {ServerHelper} helper
 * @param {Parameters<typeof puppeteer.withBrowser>} args
 * @returns
 */
async function withServerAndBrowser(helper, ...args) {
	return await helper.withServer(async () => {
		await puppeteer.withBrowser(...args);
	});
}
