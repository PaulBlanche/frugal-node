import * as assert from "node:assert/strict";
import { test } from "node:test";
import { BuildHelper, ServerHelper, puppeteer } from "@frugal-node/test-utils";

const helper = await BuildHelper.setupFixtures(import.meta.dirname);
const serverHelper = new ServerHelper(helper.runtimeConfig, helper.internalBuildConfig);

await helper.build();

await withServerAndBrowser(serverHelper, async (browser) => {
	await test("inte/preact: SSR", async () => {
		await puppeteer.withPage(
			async ({ page }) => {
				await page.goto("http://0.0.0.0:8005/page1", { waitUntil: "networkidle0" });

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"data":{"foo":"bar"},"embedData":true,"location":{"pathname":"/page1","search":""}}};</script><script async="" type="module" src="/js/page1.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"id":1,"date":new Date("1970-01-01T00:00:01.234Z"),"children":{"type":"frugal-slot"}}, name: "Client" };window.__FRUGAL__.islands.names["Client"] = window.__FRUGAL__.islands.names["Client"] || [];window.__FRUGAL__.islands.names["Client"].push("p0-0");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div>server 1 1234</div><span>data : bar</span><!--frugal-slot:start:p0-0:children--><!--frugal-slot:end:p0-0:children--><!--frugal-island:end:p0-0--></div></body></html>`,
				);
			},
			{ browser, disableJavascript: true },
		);
	});

	await test("inte/preact: hydration", async () => {
		await puppeteer.withPage(
			async ({ page }) => {
				await page.goto("http://0.0.0.0:8005/page1", { waitUntil: "networkidle0" });

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"data":{"foo":"bar"},"embedData":true,"location":{"pathname":"/page1","search":""}}};</script><script async="" type="module" src="/js/page1.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"id":1,"date":new Date("1970-01-01T00:00:01.234Z"),"children":{"type":"frugal-slot"}}, name: "Client" };window.__FRUGAL__.islands.names["Client"] = window.__FRUGAL__.islands.names["Client"] || [];window.__FRUGAL__.islands.names["Client"].push("p0-0");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div>client 1 1234</div><span>data : bar</span><!--frugal-slot:start:p0-0:children--><!--frugal-slot:end:p0-0:children--><!--frugal-island:end:p0-0--></div></body></html>`,
				);
			},
			{ browser },
		);
	});

	await test("inte/preact: embedData and useData error", async () => {
		await puppeteer.withPage(
			async ({ page }) => {
				await page.goto("http://0.0.0.0:8005/page2", { waitUntil: "networkidle0" });

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"embedData":false,"location":{"pathname":"/page2","search":""}}};</script><script async="" type="module" src="/js/page2.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"id":1,"date":new Date("1970-01-01T00:00:01.234Z"),"children":{"type":"frugal-slot"}}, name: "Client" };window.__FRUGAL__.islands.names["Client"] = window.__FRUGAL__.islands.names["Client"] || [];window.__FRUGAL__.islands.names["Client"].push("p0-0");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div>client 1 1234</div><p>data was not embeded in document</p><!--frugal-slot:start:p0-0:children--><!--frugal-slot:end:p0-0:children--><!--frugal-island:end:p0-0--></div></body></html>`,
				);
			},
			{ browser },
		);
	});

	await test("inte/preact: slot unmount/mount", async () => {
		await puppeteer.withPage(
			async ({ page }) => {
				await page.goto("http://0.0.0.0:8005/slot", { waitUntil: "networkidle0" });

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"embedData":false,"location":{"pathname":"/slot","search":""}}};</script><script async="" type="module" src="/js/page.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"children":{"type":"frugal-slot"}}, name: "Slotter" };window.__FRUGAL__.islands.names["Slotter"] = window.__FRUGAL__.islands.names["Slotter"] || [];window.__FRUGAL__.islands.names["Slotter"].push("p0-0");</script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};;window.__FRUGAL__.islands.names["DisplayCount"] = window.__FRUGAL__.islands.names["DisplayCount"] || [];window.__FRUGAL__.islands.names["DisplayCount"].push("p0-1");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div><button id="toggle">toggle mount</button><button id="increment">increment</button><div><!--frugal-slot:start:p0-0:children--><span>static data</span><!--frugal-island:start:p0-1--><span>0</span><!--frugal-island:end:p0-1--><!--frugal-slot:end:p0-0:children--></div></div><!--frugal-island:end:p0-0--></div></body></html>`,
				);

				await page.click("#toggle");

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"embedData":false,"location":{"pathname":"/slot","search":""}}};</script><script async="" type="module" src="/js/page.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"children":{"type":"frugal-slot"}}, name: "Slotter" };window.__FRUGAL__.islands.names["Slotter"] = window.__FRUGAL__.islands.names["Slotter"] || [];window.__FRUGAL__.islands.names["Slotter"].push("p0-0");</script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};;window.__FRUGAL__.islands.names["DisplayCount"] = window.__FRUGAL__.islands.names["DisplayCount"] || [];window.__FRUGAL__.islands.names["DisplayCount"].push("p0-1");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div><button id="toggle">toggle mount</button><button id="increment">increment</button></div><!--frugal-island:end:p0-0--></div></body></html>`,
				);

				await page.click("#increment");

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"embedData":false,"location":{"pathname":"/slot","search":""}}};</script><script async="" type="module" src="/js/page.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"children":{"type":"frugal-slot"}}, name: "Slotter" };window.__FRUGAL__.islands.names["Slotter"] = window.__FRUGAL__.islands.names["Slotter"] || [];window.__FRUGAL__.islands.names["Slotter"].push("p0-0");</script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};;window.__FRUGAL__.islands.names["DisplayCount"] = window.__FRUGAL__.islands.names["DisplayCount"] || [];window.__FRUGAL__.islands.names["DisplayCount"].push("p0-1");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div><button id="toggle">toggle mount</button><button id="increment">increment</button></div><!--frugal-island:end:p0-0--></div></body></html>`,
				);

				await page.click("#toggle");

				assert.equal(
					await page.content(),
					`<!DOCTYPE html><html><head><script data-priority="-2">window.__FRUGAL__ = {"pageData":{"embedData":false,"location":{"pathname":"/slot","search":""}}};</script><script async="" type="module" src="/js/page.js"></script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};window.__FRUGAL__.islands.instances["p0-0"] = { props: {"children":{"type":"frugal-slot"}}, name: "Slotter" };window.__FRUGAL__.islands.names["Slotter"] = window.__FRUGAL__.islands.names["Slotter"] || [];window.__FRUGAL__.islands.names["Slotter"].push("p0-0");</script><script data-priority="-1">window.__FRUGAL__.islands = window.__FRUGAL__.islands || { instances:{}, names:{}};;window.__FRUGAL__.islands.names["DisplayCount"] = window.__FRUGAL__.islands.names["DisplayCount"] || [];window.__FRUGAL__.islands.names["DisplayCount"].push("p0-1");</script></head><body><div><span>App</span><!--frugal-island:start:p0-0--><div><button id="toggle">toggle mount</button><button id="increment">increment</button><div><!--frugal-slot:start:p0-0:children--><span>static data</span><!--frugal-island:start:p0-1--><span>1</span><!--frugal-island:end:p0-1--><!--frugal-slot:end:p0-0:children--></div></div><!--frugal-island:end:p0-0--></div></body></html>`,
				);
			},
			{ browser },
		);
	});
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
