import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { Page } from "puppeteer";
import { Deferred } from "../../packages/frugal/src/utils/Deferred.js";
import { BuildHelper } from "../utils/BuildHelper.js";
import * as puppeteer from "../utils/puppeteer.js";

const helper = await BuildHelper.setup(import.meta.dirname);

await helper.build();

await withServerAndBrowser(helper, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page1" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page1");

			await withTimeout(sessionReadyPromise, "session should start");

			// set a variable in the current javascript context
			await page.evaluate('var foo = "foo"');

			await test("integration/session: forward navigation should be intercepted by session", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const [navigationDonePromise] = await getNavigationDonePromise(page, {
					predicate: (event) =>
						event.cause === "push" &&
						event.to.url === "http://localhost:8000/page2" &&
						event.type === "end",
				});

				const link = await page.waitForSelector("a");
				await link?.click();
				await navigationDonePromise;

				// page was not unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 0);

				// but all session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 2);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					["push", "http://localhost:8000/page1", "http://localhost:8000/page2", "start"],
				);
				const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
				assert.deepEqual(
					[
						navigationEvent2.cause,
						navigationEvent2.from.url,
						navigationEvent2.to.url,
						navigationEvent2.type,
					],
					["push", "http://localhost:8000/page1", "http://localhost:8000/page2", "end"],
				);

				assert.equal(mountEventSpy.mock.calls.length, 1);
				assert.equal(unmountEventSpy.mock.calls.length, 1);

				// the url was modified
				assert.equal(page.url(), "http://localhost:8000/page2");
				// the content was modified
				assert.equal(await page.title(), "page 2");
				// the javascript context was preserved
				assert.equal(await page.evaluate("foo"), "foo");
			});

			await test("integration/session: backward navigation should be intercepted by session", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const [navigationBackDonePromise] = await getNavigationDonePromise(page, {
					predicate: (event) =>
						event.cause === "popstate" &&
						event.to.url === "http://localhost:8000/page1" &&
						event.from.url === "http://localhost:8000/page2" &&
						event.type === "end",
				});

				await page.goBack();
				await navigationBackDonePromise;

				// all session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 2);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					[
						"popstate",
						"http://localhost:8000/page2",
						"http://localhost:8000/page1",
						"start",
					],
				);
				const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
				assert.deepEqual(
					[
						navigationEvent2.cause,
						navigationEvent2.from.url,
						navigationEvent2.to.url,
						navigationEvent2.type,
					],
					[
						"popstate",
						"http://localhost:8000/page2",
						"http://localhost:8000/page1",
						"end",
					],
				);

				assert.equal(mountEventSpy.mock.calls.length, 1);
				assert.equal(unmountEventSpy.mock.calls.length, 1);

				// the url was modified
				assert.equal(page.url(), "http://localhost:8000/page1");
				// the content was modified
				assert.equal(await page.title(), "page 1");
				// the javascript context was preserved
				assert.equal(await page.evaluate("foo"), "foo");
			});

			await test("integration/session: scroll restoration", async () => {
				// scroll /page1 to 150
				await page.evaluate("window.scroll(0, 150)");

				// go to /page2 and scroll to 151
				await page.goto("http://localhost:8000/page2");
				assert.equal(await page.evaluate("window.scrollY"), 0);
				await page.evaluate("window.scroll(0, 151)");

				// go to external page
				await page.goto("http://google.com");

				// go to /page1 and scroll to 152
				await page.goto("http://localhost:8000/page1");
				assert.equal(await page.evaluate("window.scrollY"), 0);
				await page.evaluate("window.scroll(0, 152)");

				// go to /page2
				await page.goto("http://localhost:8000/page2");
				assert.equal(await page.evaluate("window.scrollY"), 0);

				// go back to /page1
				await page.goBack();
				assert.equal(await page.evaluate("window.scrollY"), 152);

				// go back to external
				await page.goBack();

				// go back to /page2
				await page.goBack();
				assert.equal(await page.evaluate("window.scrollY"), 151);

				// go back to /page1
				await page.goBack();
				assert.equal(await page.evaluate("window.scrollY"), 150);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page3" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page3");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: nested navigation element", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const [navigationDonePromise] = await getNavigationDonePromise(page, {
					predicate: (event) =>
						event.cause === "push" &&
						event.to.url === "http://localhost:8000/page1" &&
						event.type === "end",
				});

				const link = await page.waitForSelector(".nested");
				await link?.click();
				await navigationDonePromise;

				// page was not unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 0);

				// but all session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 2);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					["push", "http://localhost:8000/page3", "http://localhost:8000/page1", "start"],
				);
				const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
				assert.deepEqual(
					[
						navigationEvent2.cause,
						navigationEvent2.from.url,
						navigationEvent2.to.url,
						navigationEvent2.type,
					],
					["push", "http://localhost:8000/page3", "http://localhost:8000/page1", "end"],
				);

				assert.equal(mountEventSpy.mock.calls.length, 1);
				assert.equal(unmountEventSpy.mock.calls.length, 1);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page3" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page3");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: external navigation element", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const link = await page.waitForSelector(".external");
				await link?.click();
				await page.waitForNavigation();

				// page was unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 1);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 0);
				assert.equal(mountEventSpy.mock.calls.length, 0);
				assert.equal(unmountEventSpy.mock.calls.length, 0);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page3" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page3");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: disabled navigation element", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const link = await page.waitForSelector(".disabled");
				await link?.click();
				await page.waitForNavigation();

				// page was unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 1);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 0);
				assert.equal(mountEventSpy.mock.calls.length, 0);
				assert.equal(unmountEventSpy.mock.calls.length, 0);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page3" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page3");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: remote-disabled navigation", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const link = await page.waitForSelector(".remote-disabled");
				await link?.click();
				await page.waitForNavigation({
					waitUntil: "networkidle0",
				});

				// page was unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 1);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 1);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					["push", "http://localhost:8000/page3", "http://localhost:8000/page4", "start"],
				);
				assert.equal(unmountEventSpy.mock.calls.length, 1);
				assert.equal(mountEventSpy.mock.calls.length, 0);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page1" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page1");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: cancel navigation start", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				await puppeteer.addPageEventListener(page, {
					event: "frugal:navigation",
					listener: () => {},
					selector: (event) => event.preventDefault(),
				});

				const link = await page.waitForSelector("a");
				await link?.click();

				// page was unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 1);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 1);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					["push", "http://localhost:8000/page1", "http://localhost:8000/page2", "start"],
				);
				assert.equal(unmountEventSpy.mock.calls.length, 0);
				assert.equal(mountEventSpy.mock.calls.length, 0);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page1" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page1");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: imperative navigation success", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const [navigationDonePromise] = await getNavigationDonePromise(page, {
					predicate: (event) =>
						event.cause === "push" &&
						event.to.url === "http://localhost:8000/page2" &&
						event.type === "end",
				});
				let isNavigationDone = false;
				navigationDonePromise.then(() => {
					isNavigationDone = true;
				});

				const navigationResult = await page.evaluate(() => {
					return window.exposed_session_navigate("http://localhost:8000/page2", {
						state: "toto",
					});
				});

				assert.ok(navigationResult, "navigation should succeed");
				assert.ok(
					isNavigationDone,
					"navigate should return a promise resolving when navigation is done",
				);

				// page was unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 0);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 2);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.from.data,
						navigationEvent1.to.url,
						navigationEvent1.to.data,
						navigationEvent1.type,
					],
					[
						"push",
						"http://localhost:8000/page1",
						undefined,
						"http://localhost:8000/page2",
						"toto",
						"start",
					],
				);
				const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
				assert.deepEqual(
					[
						navigationEvent2.cause,
						navigationEvent2.from.url,
						navigationEvent2.from.data,
						navigationEvent2.to.url,
						navigationEvent2.to.data,
						navigationEvent2.type,
					],
					[
						"push",
						"http://localhost:8000/page1",
						undefined,
						"http://localhost:8000/page2",
						"toto",
						"end",
					],
				);
				assert.equal(unmountEventSpy.mock.calls.length, 1);
				assert.equal(mountEventSpy.mock.calls.length, 1);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page1" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page1");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: imperative navigation aborted", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				await puppeteer.addPageEventListener(page, {
					event: "frugal:navigation",
					listener: () => {},
					selector: (event) => event.preventDefault(),
				});

				const navigationResult = await page.evaluate(() => {
					return window.exposed_session_navigate("http://localhost:8000/page2", {
						state: "toto",
					});
				});

				assert.ok(!navigationResult, "navigation should abort");

				// page was not unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 0);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 1);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					["push", "http://localhost:8000/page1", "http://localhost:8000/page2", "start"],
				);
				assert.equal(unmountEventSpy.mock.calls.length, 0);
				assert.equal(mountEventSpy.mock.calls.length, 0);
			});
		},
		{ browser },
	);

	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "frugal:navigation",
				listener: navigationEventSpy,
				selector: (event) => event.detail,
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "mount",
				listener: mountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: (event) => {},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://localhost:8000/page1" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://localhost:8000/page1");

			await withTimeout(sessionReadyPromise, "session should start");

			await test("integration/session: imperative navigation that throws", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				await page.evaluate(() => {
					window.fetch = () => {
						throw Error("fetch error");
					};
				});

				await assert.rejects(() =>
					page.evaluate(() => {
						return window.exposed_session_navigate("http://localhost:8000/page2", {
							state: "toto",
						});
					}),
				);

				// page was not unloaded
				assert.equal(unloadEventSpy.mock.calls.length, 0);

				// no session event were called
				assert.equal(navigationEventSpy.mock.calls.length, 1);
				const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
				assert.deepEqual(
					[
						navigationEvent1.cause,
						navigationEvent1.from.url,
						navigationEvent1.to.url,
						navigationEvent1.type,
					],
					["push", "http://localhost:8000/page1", "http://localhost:8000/page2", "start"],
				);
				assert.equal(unmountEventSpy.mock.calls.length, 1);
				assert.equal(mountEventSpy.mock.calls.length, 0);
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

/**
 * @template VALUE
 * @param {Promise<VALUE>} promise
 * @param {string} message
 * @returns {Promise<VALUE>}
 */
async function withTimeout(promise, message) {
	const timeout = setTimeout(() => {
		throw Error(message);
	}, 1000);

	promise.then(() => {
		clearTimeout(timeout);
	});

	return promise;
}

/**
 * @param {Page} page
 * @param {{predicate:(event: import("../../packages/session/src/SessionHistory.js").GlobalNavigationEvent) => boolean, onNewDocument?: boolean }} config
 */
async function getNavigationDonePromise(page, config) {
	const deferred = Deferred.create();

	await puppeteer.addPageEventListener(page, {
		event: "frugal:navigation",
		listener: (event) => {
			if (config.predicate(event)) {
				deferred.resolve();
			}
		},
		selector: (event) => event.detail,
		onNewDocument: config.onNewDocument,
	});

	return [deferred];
}
