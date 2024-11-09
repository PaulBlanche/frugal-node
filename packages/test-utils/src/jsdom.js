import * as jsdom from "jsdom";

/**
 *
 * @param {string} html
 * @param {(dom: jsdom.JSDOM) => Promise<void>|void} callback
 * @param {jsdom.ConstructorOptions} options
 * @returns {Promise<void>}
 */
export async function withDom(html, callback, options = {}) {
	const dom = new jsdom.JSDOM(html, options);

	const restore = mockGlobal(dom);

	await callback(dom);

	restore();
}

/**
 * @param {jsdom.JSDOM} dom
 */
function mockGlobal(dom) {
	const properties = ["document", "HTMLElement", "Node", "NodeFilter", "DocumentFragment"];

	/** @type {Record<string, any>} */
	const original = {};

	for (const property of properties) {
		original[property] = /** @type {any} */ (globalThis)[property];
		/** @type {any} */ (globalThis)[property] = dom.window[property];
	}

	return () => {
		for (const property of properties) {
			/** @type {any} */ (globalThis)[property] = original[property];
		}
	};
}
