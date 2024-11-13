import * as puppeteer from "puppeteer";

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
 * @param {WithBrowserOptions & { debug?: boolean, disableJavascript?: boolean }} [options]
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
		const page = await browser.newPage();

		if (options.disableJavascript) {
			await page.setJavaScriptEnabled(false);
		}

		if (options.debug) {
			debugPage(page);
		}

		try {
			await callback({ browser, page });
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
