/** @import * as self from "./NavigationObserver.js" */

import { SessionHistory } from "../SessionHistory.js";
import * as utils from "../utils.js";
import { Navigator } from "./Navigator.js";

/** @type {self.NavigationObserverCreator} */
export const NavigationObserver = {
	create,
};

const WIRED_ATTRIBUTE = "data-navigation-observer-wired";

/** @type {self.NavigationObserverCreator['create']} */
function create(config) {
	return {
		observe() {
			const isObserving = document.body.hasAttribute(WIRED_ATTRIBUTE);

			if (isObserving) {
				return;
			}

			addEventListener("click", _interceptNavigation, { capture: false });
			addEventListener("keypress", _interceptNavigation, { capture: false });
			document.body.toggleAttribute(WIRED_ATTRIBUTE, true);
		},
		disconnect() {
			const isObserving = document.body.hasAttribute(WIRED_ATTRIBUTE);

			if (!isObserving) {
				return;
			}

			removeEventListener("click", _interceptNavigation, { capture: false });
			removeEventListener("keypress", _interceptNavigation, { capture: false });
			document.body.toggleAttribute(WIRED_ATTRIBUTE, false);
		},
	};

	/**
	 *
	 * @param {MouseEvent|KeyboardEvent} event
	 */
	async function _interceptNavigation(event) {
		if (
			!event.cancelable ||
			event.defaultPrevented ||
			event.target === null ||
			(event instanceof MouseEvent && !shouldMouseEventBeHandled(event)) ||
			(event instanceof KeyboardEvent && !shouldKeyboardEventBeHandled(event))
		) {
			return;
		}

		const navigableAnchor = utils.getClosestParentNavigableAnchor(event.target);
		if (navigableAnchor === undefined) {
			return;
		}

		const beforeNavigateEvent = new CustomEvent("frugal:beforenavigate");
		dispatchEvent(beforeNavigateEvent);
		if (beforeNavigateEvent.defaultPrevented) {
			return;
		}

		const navigator = Navigator.create(navigableAnchor, config);

		const result = await navigator.navigate(event);

		if (result.status === "aborted") {
			console.log(`Navigation aborted: ${result.reason}`);
			SessionHistory.disconnect();
		}
		if (result.status === "failure") {
			console.error(new Error("Navigation failure", { cause: result.error }));
			SessionHistory.disconnect();
		}
	}
}

/**
 * @param {MouseEvent} event
 * @returns {boolean}
 */
function shouldMouseEventBeHandled(event) {
	return !(event.ctrlKey || event.altKey || event.shiftKey || event.metaKey);
}

/**
 * @param {KeyboardEvent} event
 * @returns {boolean}
 */
function shouldKeyboardEventBeHandled(event) {
	return document.activeElement === event.target && event.key === "Enter";
}
