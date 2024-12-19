/** @import { JSDOM } from "jsdom"; */

/** @type {string[]} */
const DOM_KEYS = ["_jsdom", "_restore", "DOMParser"];

/**
 * @param {JSDOM} instance
 */
export function setup(instance) {
	const window = instance.window;

	for (const key of DOM_KEYS) {
		if (key === "_jsdom") {
			/** @type {any} */ (globalThis)["_jsdom"] = instance;
		} else {
			/** @type {any} */ (globalThis)[key] = window[key];
		}
	}
	globalThis.document = window.document;
	globalThis.window = /** @type {any} */ (window);
	window["console"] = /** @type {any} */ (globalThis.console);

	/** @type {any} */ (globalThis)["_restore"] = restore;

	return restore;

	function restore() {
		for (const key of DOM_KEYS) {
			delete (/** @type {any} */ (globalThis)[key]);
		}
	}
}
