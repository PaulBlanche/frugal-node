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
 * @param {WithBrowserOptions & { debug?: boolean }} [options]
 * @returns
 */
export async function withPage(callback, options = {}) {
	if (options.browser) {
		const page = await options.browser.newPage();

		if (options.debug) {
			debugPage(page);
		}

		try {
			await callback({ browser: options.browser, page });
		} finally {
			await page.close();
		}
	} else {
		return withBrowser(async (browser) => {
			const page = await browser.newPage();

			if (options.debug) {
				debugPage(page);
			}

			try {
				await callback({ browser, page });
			} finally {
				await page.close();
			}
		}, options);
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

/*
export async function addPageEventListener<SELECTED>(
    event: string,
    callback: (event: SELECTED) => void,
    page: Page,
    config?: {
        functionName?: string;
        selector?: string;
        onNewDocument?: boolean;
    },
) {
    const functionName = config?.functionName ?? `listener_${String(Math.random()).slice(2)}`;

    const selector = config?.selector ?? "() => {}";

    const toEvaluate = `
        const selector_${functionName} = ${selector.toString()}
        addEventListener("${event}", (event) => ${functionName}(selector_${functionName}(event)))
    `;

    await page.exposeFunction(functionName, (selected: any) => callback(selected));

    if (config?.onNewDocument) {
        await page.evaluateOnNewDocument(toEvaluate);
    } else {
        await page.evaluate(toEvaluate);
    }
}*/

/**
 * @template SELECTED
 * @param {puppeteer.Page} page
 * @param {{ event:string, listener:(event: SELECTED) => void, selector: (event: any) => SELECTED; functionName?: string; onNewDocument?: boolean }} config
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
