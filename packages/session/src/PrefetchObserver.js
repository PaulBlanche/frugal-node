import { Prefetcher } from "./Prefetcher.js";
import * as utils from "./utils.js";

/** @type {import('./PrefetchObserver.ts').PrefetchObserverMaker} */
export const PrefetchObserver = {
	create,
};

const WIRED_ATTRIBUTE = "data-prefetch-observer-wired";

/** @type {import('./PrefetchObserver.ts').PrefetchObserverMaker['create']} */
function create(config) {
	/** @type {Map<string, Prefetcher>} */
	const prefetchers = new Map();

	return {
		observe() {
			const isObserving = document.body.hasAttribute(WIRED_ATTRIBUTE);

			if (isObserving) {
				return;
			}

			addEventListener("mouseover", _schedule, { capture: false });
			addEventListener("mouseout", _cancel, { capture: false });
			addEventListener("touchstart", _schedule, { capture: false });
			addEventListener("touchend", _cancel, { capture: false });
			addEventListener("touchcancel", _cancel, { capture: false });
			addEventListener("focusin", _schedule, { capture: false });
			addEventListener("focusout", _cancel, { capture: false });
			document.body.toggleAttribute(WIRED_ATTRIBUTE, true);
		},
		disconnect() {
			const isObserving = document.body.hasAttribute(WIRED_ATTRIBUTE);

			if (!isObserving) {
				return;
			}

			removeEventListener("mouseover", _schedule, { capture: false });
			removeEventListener("mouseout", _cancel, { capture: false });
			removeEventListener("touchstart", _schedule, { capture: false });
			removeEventListener("touchend", _cancel, { capture: false });
			removeEventListener("touchcancel", _cancel, { capture: false });
			removeEventListener("focusin", _schedule, { capture: false });
			removeEventListener("focusout", _cancel, { capture: false });
			document.body.toggleAttribute(WIRED_ATTRIBUTE, false);
		},
	};

	/**
	 * @param {MouseEvent | TouchEvent | FocusEvent} event
	 */
	function _schedule(event) {
		if (event.target === null) {
			return;
		}

		const prefetcher = _getPrefetcher(event.target);

		if (prefetcher === undefined) {
			return;
		}

		prefetcher.schedule();
	}

	/**
	 * @param {MouseEvent | TouchEvent | FocusEvent} event
	 */
	function _cancel(event) {
		if (event.target === null) {
			return;
		}

		const prefetcher = _getPrefetcher(event.target);

		if (prefetcher === undefined) {
			return;
		}

		prefetcher.cancel();
	}

	/**
	 *
	 * @param {EventTarget} target
	 * @returns {Prefetcher|undefined}
	 */
	function _getPrefetcher(target) {
		const navigableAnchor = utils.getClosestParentNavigableAnchor(target);
		if (navigableAnchor === undefined) {
			return;
		}

		if (!Prefetcher.prefetchable(config, navigableAnchor)) {
			return;
		}

		const url = utils.getUrl(navigableAnchor.href);

		if (!prefetchers.has(url.href)) {
			const instance = Prefetcher.create(url, config);
			instance.addEventListener("disposable", () => {
				prefetchers.delete(url.href);
			});
			prefetchers.set(url.href, instance);
		}

		return prefetchers.get(url.href);
	}
}
