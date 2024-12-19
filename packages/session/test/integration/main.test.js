/** @import { GlobalNavigationEvent } from "../../src/navigation/Navigation.js" */
/** @import { Page } from "puppeteer"; */

import * as assert from "node:assert/strict";
import { mock, test } from "node:test";
import { BuildHelper, ServerHelper, puppeteer } from "@frugal-node/test-utils";

const helper = await BuildHelper.setupFixtures(import.meta.dirname);
const serverHelper = new ServerHelper(helper.runtimeConfig, helper.internalBuildConfig);

await helper.build();

await withServerAndBrowser(serverHelper, async (browser) => {
	await puppeteer.withPage(
		async ({ page }) => {
			const unloadEventSpy = mock.fn();
			const navigationEventSpy = mock.fn();
			const mountEventSpy = mock.fn();
			const unmountEventSpy = mock.fn();

			await puppeteer.addPageEventListener(page, {
				event: "beforeunload",
				listener: unloadEventSpy,
				selector: () => {
					/* empty on purpose */
				},
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
				selector: () => {
					/* empty on purpose */
				},
				onNewDocument: true,
			});
			await puppeteer.addPageEventListener(page, {
				event: "unmount",
				listener: unmountEventSpy,
				selector: () => {
					/* empty on purpose */
				},
				onNewDocument: true,
			});

			const [sessionReadyPromise] = await getNavigationDonePromise(page, {
				predicate: (event) =>
					event.cause === "pageshow" &&
					event.to.url === "http://0.0.0.0:8004/page1" &&
					event.type === "end",
				onNewDocument: true,
			});

			await page.goto("http://0.0.0.0:8004/page1");

			await withTimeout(sessionReadyPromise, "session should start");

			// set a variable in the current javascript context
			await page.evaluate('var foo = "foo"');

			await test("inte/session: forward navigation should be intercepted by session", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const [navigationDonePromise] = await getNavigationDonePromise(page, {
					predicate: (event) =>
						event.cause === "push" &&
						event.to.url === "http://0.0.0.0:8004/page2" &&
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
					["push", "http://0.0.0.0:8004/page1", "http://0.0.0.0:8004/page2", "start"],
				);
				const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
				assert.deepEqual(
					[
						navigationEvent2.cause,
						navigationEvent2.from.url,
						navigationEvent2.to.url,
						navigationEvent2.type,
					],
					["push", "http://0.0.0.0:8004/page1", "http://0.0.0.0:8004/page2", "end"],
				);

				assert.equal(mountEventSpy.mock.calls.length, 1);
				assert.equal(unmountEventSpy.mock.calls.length, 1);

				// the url was modified
				assert.equal(page.url(), "http://0.0.0.0:8004/page2");
				// the content was modified
				assert.equal(await page.title(), "page 2");
				// the javascript context was preserved
				assert.equal(await page.evaluate("foo"), "foo");
			});

			await test("inte/session: backward navigation should be intercepted by session", async () => {
				unloadEventSpy.mock.resetCalls();
				navigationEventSpy.mock.resetCalls();
				mountEventSpy.mock.resetCalls();
				unmountEventSpy.mock.resetCalls();

				const [navigationBackDonePromise] = await getNavigationDonePromise(page, {
					predicate: (event) =>
						event.cause === "popstate" &&
						event.to.url === "http://0.0.0.0:8004/page1" &&
						event.from.url === "http://0.0.0.0:8004/page2" &&
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
					["popstate", "http://0.0.0.0:8004/page2", "http://0.0.0.0:8004/page1", "start"],
				);
				const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
				assert.deepEqual(
					[
						navigationEvent2.cause,
						navigationEvent2.from.url,
						navigationEvent2.to.url,
						navigationEvent2.type,
					],
					["popstate", "http://0.0.0.0:8004/page2", "http://0.0.0.0:8004/page1", "end"],
				);

				assert.equal(mountEventSpy.mock.calls.length, 1);
				assert.equal(unmountEventSpy.mock.calls.length, 1);

				// the url was modified
				assert.equal(page.url(), "http://0.0.0.0:8004/page1");
				// the content was modified
				assert.equal(await page.title(), "page 1");
				// the javascript context was preserved
				assert.equal(await page.evaluate("foo"), "foo");
			});

			await test("inte/session: scroll restoration", async () => {
				// scroll /page1 to 150
				await page.evaluate("window.scroll(0, 150)");

				// go to /page2 and scroll to 151
				await page.goto("http://0.0.0.0:8004/page2");
				assert.equal(await page.evaluate("window.scrollY"), 0);
				await page.evaluate("window.scroll(0, 151)");

				// go to external page
				await page.goto("http://google.com");

				// go to /page1 and scroll to 152
				await page.goto("http://0.0.0.0:8004/page1");
				assert.equal(await page.evaluate("window.scrollY"), 0);
				await page.evaluate("window.scroll(0, 152)");

				// go to /page2
				await page.goto("http://0.0.0.0:8004/page2");
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

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page3" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page3");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: nested navigation element", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			const [navigationDonePromise] = await getNavigationDonePromise(page, {
	// 				predicate: (event) =>
	// 					event.cause === "push" &&
	// 					event.to.url === "http://0.0.0.0:8004/page1" &&
	// 					event.type === "end",
	// 			});

	// 			const link = await page.waitForSelector(".nested");
	// 			await link?.click();
	// 			await navigationDonePromise;

	// 			// page was not unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 0);

	// 			// but all session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 2);
	// 			const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent1.cause,
	// 					navigationEvent1.from.url,
	// 					navigationEvent1.to.url,
	// 					navigationEvent1.type,
	// 				],
	// 				["push", "http://0.0.0.0:8004/page3", "http://0.0.0.0:8004/page1", "start"],
	// 			);
	// 			const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent2.cause,
	// 					navigationEvent2.from.url,
	// 					navigationEvent2.to.url,
	// 					navigationEvent2.type,
	// 				],
	// 				["push", "http://0.0.0.0:8004/page3", "http://0.0.0.0:8004/page1", "end"],
	// 			);

	// 			assert.equal(mountEventSpy.mock.calls.length, 1);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 1);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page3" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page3");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: external navigation element", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			const link = await page.waitForSelector(".external");
	// 			await link?.click();
	// 			await page.waitForNavigation();

	// 			// page was unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 1);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 0);
	// 			assert.equal(mountEventSpy.mock.calls.length, 0);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 0);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page3" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page3");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: disabled navigation element", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			const link = await page.waitForSelector(".disabled");
	// 			await link?.click();
	// 			await page.waitForNavigation();

	// 			// page was unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 1);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 0);
	// 			assert.equal(mountEventSpy.mock.calls.length, 0);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 0);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page3" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page3");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: remote-disabled navigation", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			const link = await page.waitForSelector(".remote-disabled");
	// 			await link?.click();
	// 			await page.waitForNavigation({
	// 				waitUntil: "networkidle0",
	// 			});

	// 			// page was unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 1);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 1);
	// 			const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent1.cause,
	// 					navigationEvent1.from.url,
	// 					navigationEvent1.to.url,
	// 					navigationEvent1.type,
	// 				],
	// 				["push", "http://0.0.0.0:8004/page3", "http://0.0.0.0:8004/page4", "start"],
	// 			);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 1);
	// 			assert.equal(mountEventSpy.mock.calls.length, 0);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page1" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page1");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: cancel navigation start", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			await puppeteer.addPageEventListener(page, {
	// 				event: "frugal:navigation",
	// 				listener: () => {
	// 					/* empty on purpose */
	// 				},
	// 				selector: (event) => event.preventDefault(),
	// 			});

	// 			const link = await page.waitForSelector("a");
	// 			await link?.click();

	// 			// page was unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 1);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 1);
	// 			const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent1.cause,
	// 					navigationEvent1.from.url,
	// 					navigationEvent1.to.url,
	// 					navigationEvent1.type,
	// 				],
	// 				["push", "http://0.0.0.0:8004/page1", "http://0.0.0.0:8004/page2", "start"],
	// 			);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 0);
	// 			assert.equal(mountEventSpy.mock.calls.length, 0);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page1" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page1");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: imperative navigation success", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			const [navigationDonePromise] = await getNavigationDonePromise(page, {
	// 				predicate: (event) =>
	// 					event.cause === "push" &&
	// 					event.to.url === "http://0.0.0.0:8004/page2" &&
	// 					event.type === "end",
	// 			});
	// 			let isNavigationDone = false;
	// 			navigationDonePromise.then(() => {
	// 				isNavigationDone = true;
	// 			});

	// 			const navigationResult = await page.evaluate(() => {
	// 				return /** @type{any}*/ (window).exposed_session_navigate(
	// 					"http://0.0.0.0:8004/page2",
	// 					{
	// 						state: "toto",
	// 					},
	// 				);
	// 			});

	// 			assert.ok(navigationResult, "navigation should succeed");
	// 			assert.ok(
	// 				isNavigationDone,
	// 				"navigate should return a promise resolving when navigation is done",
	// 			);

	// 			// page was unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 0);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 2);
	// 			const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent1.cause,
	// 					navigationEvent1.from.url,
	// 					navigationEvent1.from.data,
	// 					navigationEvent1.to.url,
	// 					navigationEvent1.to.data,
	// 					navigationEvent1.type,
	// 				],
	// 				[
	// 					"push",
	// 					"http://0.0.0.0:8004/page1",
	// 					undefined,
	// 					"http://0.0.0.0:8004/page2",
	// 					"toto",
	// 					"start",
	// 				],
	// 			);
	// 			const navigationEvent2 = navigationEventSpy.mock.calls[1].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent2.cause,
	// 					navigationEvent2.from.url,
	// 					navigationEvent2.from.data,
	// 					navigationEvent2.to.url,
	// 					navigationEvent2.to.data,
	// 					navigationEvent2.type,
	// 				],
	// 				[
	// 					"push",
	// 					"http://0.0.0.0:8004/page1",
	// 					undefined,
	// 					"http://0.0.0.0:8004/page2",
	// 					"toto",
	// 					"end",
	// 				],
	// 			);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 1);
	// 			assert.equal(mountEventSpy.mock.calls.length, 1);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page1" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page1");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: imperative navigation aborted", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			await puppeteer.addPageEventListener(page, {
	// 				event: "frugal:navigation",
	// 				listener: () => {
	// 					/* empty on purpose */
	// 				},
	// 				selector: (event) => event.preventDefault(),
	// 			});

	// 			const navigationResult = await page.evaluate(() => {
	// 				return /** @type{any}*/ (window).exposed_session_navigate(
	// 					"http://0.0.0.0:8004/page2",
	// 					{
	// 						state: "toto",
	// 					},
	// 				);
	// 			});

	// 			assert.ok(!navigationResult, "navigation should abort");

	// 			// page was not unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 0);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 1);
	// 			const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent1.cause,
	// 					navigationEvent1.from.url,
	// 					navigationEvent1.to.url,
	// 					navigationEvent1.type,
	// 				],
	// 				["push", "http://0.0.0.0:8004/page1", "http://0.0.0.0:8004/page2", "start"],
	// 			);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 0);
	// 			assert.equal(mountEventSpy.mock.calls.length, 0);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page1" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page1");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: imperative navigation that throws", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			await page.evaluate(() => {
	// 				window.fetch = () => {
	// 					throw new Error("fetch error");
	// 				};
	// 			});

	// 			await assert.rejects(() =>
	// 				page.evaluate(() => {
	// 					return /** @type{any}*/ (window).exposed_session_navigate(
	// 						"http://0.0.0.0:8004/page2",
	// 						{
	// 							state: "toto",
	// 						},
	// 					);
	// 				}),
	// 			);

	// 			// page was not unloaded
	// 			assert.equal(unloadEventSpy.mock.calls.length, 0);

	// 			// no session event were called
	// 			assert.equal(navigationEventSpy.mock.calls.length, 1);
	// 			const navigationEvent1 = navigationEventSpy.mock.calls[0].arguments[0];
	// 			assert.deepEqual(
	// 				[
	// 					navigationEvent1.cause,
	// 					navigationEvent1.from.url,
	// 					navigationEvent1.to.url,
	// 					navigationEvent1.type,
	// 				],
	// 				["push", "http://0.0.0.0:8004/page1", "http://0.0.0.0:8004/page2", "start"],
	// 			);
	// 			assert.equal(unmountEventSpy.mock.calls.length, 1);
	// 			assert.equal(mountEventSpy.mock.calls.length, 0);
	// 		});
	// 	},
	// 	{ browser },
	// );

	// await puppeteer.withPage(
	// 	async ({ page }) => {
	// 		const unloadEventSpy = mock.fn();
	// 		const navigationEventSpy = mock.fn();
	// 		const mountEventSpy = mock.fn();
	// 		const unmountEventSpy = mock.fn();

	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "beforeunload",
	// 			listener: unloadEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "frugal:navigation",
	// 			listener: navigationEventSpy,
	// 			selector: (event) => event.detail,
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "mount",
	// 			listener: mountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});
	// 		await puppeteer.addPageEventListener(page, {
	// 			event: "unmount",
	// 			listener: unmountEventSpy,
	// 			selector: () => {
	// 				/* empty on purpose */
	// 			},
	// 			onNewDocument: true,
	// 		});

	// 		const [sessionReadyPromise] = await getNavigationDonePromise(page, {
	// 			predicate: (event) =>
	// 				event.cause === "pageshow" &&
	// 				event.to.url === "http://0.0.0.0:8004/page6" &&
	// 				event.type === "end",
	// 			onNewDocument: true,
	// 		});

	// 		await page.goto("http://0.0.0.0:8004/page6");

	// 		await withTimeout(sessionReadyPromise, "session should start");

	// 		await test("inte/session: script and modules", async () => {
	// 			unloadEventSpy.mock.resetCalls();
	// 			navigationEventSpy.mock.resetCalls();
	// 			mountEventSpy.mock.resetCalls();
	// 			unmountEventSpy.mock.resetCalls();

	// 			const [navigationDonePromise] = await getNavigationDonePromise(page, {
	// 				predicate: (event) =>
	// 					event.cause === "push" &&
	// 					event.to.url === "http://0.0.0.0:8004/page7" &&
	// 					event.type === "end",
	// 			});

	// 			/** @type {PromiseWithResolvers<number>} */
	// 			const scriptCountDeferred = Promise.withResolvers();
	// 			await puppeteer.addPageEventListener(page, {
	// 				event: "script",
	// 				listener: (event) => {
	// 					scriptCountDeferred.resolve(event);
	// 				},
	// 				selector: (event) => event.detail,
	// 			});

	// 			/** @type {PromiseWithResolvers<number>} */
	// 			const moduleCountDeferred = Promise.withResolvers();
	// 			await puppeteer.addPageEventListener(page, {
	// 				event: "module",
	// 				listener: (event) => {
	// 					moduleCountDeferred.resolve(event);
	// 				},
	// 				selector: (event) => event.detail,
	// 			});

	// 			const link = await page.waitForSelector("a");
	// 			await link?.click();
	// 			await navigationDonePromise;

	// 			const [scriptCount, moduleCount] = await Promise.all([
	// 				scriptCountDeferred.promise,
	// 				moduleCountDeferred.promise,
	// 			]);

	// 			// script are re-evaluated on navigation
	// 			assert.strictEqual(scriptCount, 2);
	// 			// module are not
	// 			assert.strictEqual(moduleCount, 1);
	// 		});
	// 	},
	// 	{ browser },
	// );
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

/**
 * @template VALUE
 * @param {Promise<VALUE>} promise
 * @param {string} message
 * @returns {Promise<VALUE>}
 */
async function withTimeout(promise, message) {
	const timeout = setTimeout(() => {
		throw new Error(message);
	}, 1000);

	promise.then(() => {
		clearTimeout(timeout);
	});

	return promise;
}

/**
 * @param {Page} page
 * @param {{predicate:(event: GlobalNavigationEvent) => boolean, onNewDocument?: boolean }} config
 * @returns {Promise<[Promise<void>]>}
 */
async function getNavigationDonePromise(page, config) {
	/** @type {PromiseWithResolvers<void>} */
	const deferred = Promise.withResolvers();

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

	return [deferred.promise];
}
