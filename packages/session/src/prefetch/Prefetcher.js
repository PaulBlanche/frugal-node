/** @import * as self from "./Prefetcher.js" */

import * as utils from "../utils.js";

/** @type {self.PrefetcherCreator} */
export const Prefetcher = {
	create,
	prefetchable,
};

const Status = /** @type {const}*/ ({
	INITIAL: 0,
	WAITING: 1,
	DONE: 2,
});

/** @type {self.PrefetcherCreator['create']} */
function create(url, config) {
	const state = {
		/** @type {(typeof Status)[keyof typeof Status]}*/
		status: Status.INITIAL,
		/** @type {ReturnType<setTimeout>|undefined} */
		timeoutHandler: undefined,
		/** @type {ReturnType<setTimeout>|undefined} */
		disposeHandler: undefined,
		lastPrefetch: 0,
		listeners: {
			/** @type {(()=>void)[]} */
			disposable: [],
		},
		/** @type {HTMLLinkElement|undefined} */
		linkElement: undefined,
	};

	return {
		addEventListener(type, listener) {
			state.listeners[type].push(listener);
		},
		schedule() {
			if (state.status === Status.DONE && Date.now() - state.lastPrefetch > config.cooldown) {
				state.status = Status.INITIAL;
			}

			if (state.status !== Status.INITIAL) {
				return;
			}

			clearTimeout(state.disposeHandler);

			state.status = Status.WAITING;

			state.timeoutHandler = setTimeout(_prefetch, config.timeout);
		},
		cancel() {
			if (state.status !== Status.WAITING) {
				return;
			}

			state.status = Status.INITIAL;

			clearTimeout(state.timeoutHandler);

			state.disposeHandler = setTimeout(_dispose, 5000);
		},
	};

	function _prefetch() {
		if (state.status !== Status.WAITING) {
			return;
		}

		state.status = Status.DONE;
		state.lastPrefetch = Date.now();

		if (state.linkElement === undefined || !document.head.contains(state.linkElement)) {
			const linkElement = document.createElement("link");
			linkElement.rel = "prefetch";
			linkElement.href = url.href;
			state.linkElement = linkElement;
			document.head.appendChild(linkElement);
		} else {
			document.head.removeChild(state.linkElement);
			document.head.appendChild(state.linkElement);
		}

		state.disposeHandler = setTimeout(_dispose, 5000);
	}

	function _dispose() {
		if (state.linkElement && state.linkElement.parentNode !== null) {
			document.head.removeChild(state.linkElement);
		}
		_emit("disposable");
	}

	/**
	 * @param {"disposable"} type
	 */
	function _emit(type) {
		for (const listener of state.listeners[type]) {
			listener();
		}
	}
}

/** @type {self.PrefetcherCreator['prefetchable']} */
function prefetchable(config, anchor) {
	const prefetch = anchor.getAttribute("data-frugal-prefetch");
	const shouldPrefetch = config.defaultPrefetch ? prefetch !== "false" : prefetch === "true";
	const url = utils.getUrl(anchor.href);
	return shouldPrefetch && utils.isInternalUrl(url);
}
