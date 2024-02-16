import * as assert from "node:assert/strict";
import * as fs from "node:fs";
import { test } from "node:test";
import * as url from "node:url";
import { CookieSessionStorage } from "../../../packages/frugal/exports/index.js";
import * as crypto from "../../../packages/frugal/exports/utils/crypto/index.js";
import * as deferred from "../../../packages/frugal/exports/utils/deferred/index.js";
import { BuildHelper } from "../../utils/BuildHelper.js";
import * as puppeteer from "../../utils/puppeteer.js";

const helper = await BuildHelper.setup(import.meta.dirname);

await helper.build();

await withServerAndBrowser(helper, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			await test("integration/server: serving basic static page without jit", async () => {
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
			await test("integration/server: serving basic static page with jit", async () => {
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
			await test("integration/server: serving basic static page with invalid jit", async () => {
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
			await test("integration/server: serving basic static page with force refresh", async () => {
				const timestamp = Date.now();
				const signature = await crypto.sign(
					await crypto.importKey(
						"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
					),
					String(timestamp),
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
					`http://localhost:8000/static/5?timestamp=${timestamp}&sign=${signature}`,
				);

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
				assert.deepEqual(body, {
					params: { slug: "5" },
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
			await test("integration/server: fail force refresh (timestamp too old)", async () => {
				// modify data.json but only data used by page1/1
				const dataURL = import.meta.resolve("./project/data.json");
				const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
					encoding: "utf-8",
				});
				await fs.promises.writeFile(url.fileURLToPath(dataURL), '"foobar"', {
					encoding: "utf-8",
				});

				const timestampToOld = Date.now() - 20 * 1000;
				const signatureToOld = await crypto.sign(
					await crypto.importKey(
						"eyJrdHkiOiJvY3QiLCJrIjoieENtNHc2TDNmZDBrTm8wN3FLckFnZUg4OWhYQldzWkhsalZJYjc2YkpkWjdja2ZPWXpub1gwbXE3aHZFMlZGbHlPOHlVNGhaS29FQUo4cmY3WmstMjF4SjNTRTZ3RDRURF8wdHVvQm9TM2VNZThuUy1pOFA4QVQxcnVFT05tNVJ3N01FaUtJX0xMOWZWaEkyN1BCRTJrbmUxcm80M19wZ2tZWXdSREZ6NFhNIiwiYWxnIjoiSFM1MTIiLCJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlfQ==",
					),
					String(timestampToOld),
				);

				const response = await page.goto(
					`http://localhost:8000/static/5?timestamp=${timestampToOld}&sign=${signatureToOld}`,
				);

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
				assert.deepEqual(body, {
					params: { slug: "5" },
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
			await test("integration/server: fail force refresh (invalid key)", async () => {
				// modify data.json but only data used by page1/1
				const dataURL = import.meta.resolve("./project/data.json");
				const originalData = await fs.promises.readFile(url.fileURLToPath(dataURL), {
					encoding: "utf-8",
				});
				await fs.promises.writeFile(url.fileURLToPath(dataURL), '"foobar"', {
					encoding: "utf-8",
				});

				const timestamp = Date.now();
				const signatureInvalid = await crypto.sign(
					await crypto.importKey(
						"eyJrZXlfb3BzIjpbInNpZ24iLCJ2ZXJpZnkiXSwiZXh0Ijp0cnVlLCJrdHkiOiJvY3QiLCJrIjoibGJsdlZnV0daLXVHa1VNOW5lZERUalhZOFJ0dk9oZ2g2MW5wUDE5R2hnTE5zNDNMTDMzWmIxdlYySUlqNE11UEQzSHBGZWk0R09PblZuX0VtcFdYengyWHcxNmhvdjZpdmZXVm5heTh5TDczQWxXNnVPRG9ZUjZMNVpUUUNUWW45QmNUSWZjYWhnb1RoWnJQTXFwbldFSjBlTnQxMUhLT2d0M2tfc2dLeThvIiwiYWxnIjoiSFM1MTIifQ==",
					),
					String(timestamp),
				);

				const response = await page.goto(
					`http://localhost:8000/static/5?timestamp=${timestamp}&sign=${signatureInvalid}`,
				);

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.strictEqual(response?.headers()["content-type"], "application/json");
				assert.deepEqual(body, {
					params: { slug: "5" },
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
			await test("integration/server: serving basic static page with invalid method", async () => {
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
			await test("integration/server: serving basic dynamic page GET", async () => {
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
			await test("integration/server: static page with post/redirect", async () => {
				await page.setRequestInterception(true);

				page.on("request", (interceptedRequest) => {
					interceptedRequest.continue({
						method: "POST",
					});
				});

				const response = await page.goto("http://localhost:8000/static/4?foo=bar");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.json();

				assert.deepEqual(body, {
					params: { slug: "4" },
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
			await test("integration/server: Etag 304", async () => {
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
			await test("integration/server: static file", async () => {
				const response = await page.goto("http://localhost:8000/file.txt");

				if (response === null) {
					assert.fail("response should not be null");
				}

				const body = await response.text();

				assert.strictEqual(response.status(), 200);
				assert.strictEqual(
					response.headers()["cache-control"],
					"max-age=31536000, immutable",
				);
				assert.deepEqual(body, "foo");
			});
		},
		{ browser },
	);
});

await withServerAndBrowser(helper, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			await test("integration/server: trailing slash redirect", async () => {
				const promise = deferred.create();

				page.on("response", (response) => {
					if (response.url() === "http://localhost:8000/static/1/") {
						try {
							assert.strictEqual(response.status(), 301);
							assert.strictEqual(response.headers()["location"], "/static/1");
							promise.resolve();
						} catch (error) {
							promise.reject(error);
						}
					}
				});

				const response = await page.goto("http://localhost:8000/static/1/");

				if (response === null) {
					assert.fail("response should not be null");
				}

				await promise;
			});
		},
		{ browser },
	);
});

const helperWithCookieSessionStorage = helper.extends((config) => ({
	...config,
	server: {
		...config.server,
		session: {
			...config.server?.session,
			storage: new CookieSessionStorage(),
		},
	},
}));

await withServerAndBrowser(helperWithCookieSessionStorage, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			await test("integration/server: session with cookie storage", async () => {
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
 * @param {BuildHelper} helper
 * @param {Parameters<typeof puppeteer.withBrowser>} args
 * @returns
 */
async function withServerAndBrowser(helper, ...args) {
	return await helper.withServer(async () => {
		await puppeteer.withBrowser(...args);
	});
}
