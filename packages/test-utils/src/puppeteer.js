import * as puppeteer from "puppeteer";
import { withCoverage } from "./puppeteer-coverage.js";

/** @typedef {{ onClose?: () => Promise<void> | void, browser?: puppeteer.Browser }} WithBrowserOptions */

/**
 *
 * @param {(browser: puppeteer.Browser) => Promise<void>|void} callback
 * @param {WithBrowserOptions} [options]
 */
export async function withBrowser(callback, options = {}) {
	const browser = await puppeteer.launch({ headless: true });
	try {
		await callback(browser);
	} finally {
		await options?.onClose?.();
		await browser.close();
	}
}

/** @typedef {{ page: puppeteer.Page, browser: puppeteer.Browser }} WithPageCallbackParams */

/**
 *
 * @param {({ browser, page }: WithPageCallbackParams) => Promise<void>|void} callback
 * @param {WithBrowserOptions & { debug?: boolean, disableJavascript?: boolean, coverage?:boolean }} [options]
 * @returns
 */
export async function withPage(callback, options = {}) {
	if (options.browser) {
		await setupPage(options.browser);
	} else {
		return withBrowser(async (browser) => {
			await setupPage(browser);
		}, options);
	}

	/**
	 * @param {puppeteer.Browser} browser
	 */
	async function setupPage(browser) {
		const coverage = options.coverage ?? true;
		const page = await browser.newPage();

		if (options.disableJavascript) {
			await page.setJavaScriptEnabled(false);
		}

		if (options.debug) {
			debugPage(page);
		}

		try {
			if (coverage && !options.disableJavascript) {
				await withCoverage(() => callback({ browser, page }), { page });
			} else {
				await callback({ browser, page });
			}
		} finally {
			await page.close();
		}
	}
}

/**
 * @param {puppeteer.Page} page
 */
function debugPage(page) {
	page.on("console", (message) =>
		console.log(`${message.type().substr(0, 3).toUpperCase()} ${message.text()}`),
	)
		.on("pageerror", ({ message }) => console.log(message))
		.on("response", (response) => console.log(`${response.status()} ${response.url()}`))
		.on("requestfailed", (request) =>
			console.log(`${request.failure()?.errorText ?? ""} ${request.url()}`),
		);
}

/**
 * @template SELECTED
 * @param {puppeteer.Page} page
 * @param {{ event:string, listener:(event: SELECTED) => void, selector: (event: any) => SELECTED; functionName?: string; onNewDocument?: boolean | undefined }} config
 * @returns {Promise<void>}
 */
export async function addPageEventListener(page, config) {
	const listenerName = config?.functionName ?? `listener_${String(Math.random()).slice(2)}`;
	const selectorName = `selector_${listenerName}`;

	const toEvaluate = `const ${selectorName} = ${config.selector.toString()}
addEventListener("${config.event}", (event) => {
	${listenerName}(JSON.stringify(${selectorName}(event)));
});`;

	await page.exposeFunction(
		listenerName,
		/** @param {any} selected*/ (selected) => config.listener(JSON.parse(selected)),
	);

	if (config?.onNewDocument) {
		await page.evaluateOnNewDocument(toEvaluate);
	} else {
		await page.evaluate(toEvaluate);
	}
}

import { SourceMapConsumer } from "source-map";
import * as vfilLocation from "vfile-location";

const INLINE_SOURCEMAP_REGEX = /^data:application\/json[^,]+base64,/;
const SOURCEMAP_REGEX =
	/(?:\/\/[@#][ \t]+sourceMappingURL=([^\s'"]+?)[ \t]*$)|(?:\/\*[@#][ \t]+sourceMappingURL=([^*]+?)[ \t]*(?:\*\/)[ \t]*$)/;

/**
 * @param {string} source
 */
function loadSourceMap(source) {
	const sourceMapURL = getSourceMapURL(source);

	if (sourceMapURL === undefined) {
		return undefined;
	}

	return new SourceMapConsumer(decodeInlineMap(sourceMapURL));
}

/**
 *
 * @param {string} base64Data
 * @returns {string}
 */
function decodeInlineMap(base64Data) {
	const rawData = base64Data.slice(base64Data.indexOf(",") + 1);
	return Buffer.from(rawData, "base64").toString();
}
/**
 * @param {string} source
 * @returns
 */
function getSourceMapURL(source) {
	const lines = source.split(/\r?\n/);
	let sourceMapUrl = null;
	for (let i = lines.length - 1; i >= 0 && !sourceMapUrl; i--) {
		sourceMapUrl = lines[i].match(SOURCEMAP_REGEX);
	}

	if (!sourceMapUrl) {
		return undefined;
	}

	return isInlineMap(sourceMapUrl[1]) ? sourceMapUrl[1] : undefined;
}

/**
 *
 * @param {string} sourceMappingURL
 * @returns
 */
function isInlineMap(sourceMappingURL) {
	return INLINE_SOURCEMAP_REGEX.test(sourceMappingURL);
}
