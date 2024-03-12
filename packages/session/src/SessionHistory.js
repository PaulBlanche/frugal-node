import { Navigation } from "./Navigation.js";
import { restoreScroll } from "./scroll.js";

/** @type {import("./SessionHistory.ts").SessionHistory|undefined} */
let INSTANCE = undefined;

/** @type {import('./SessionHistory.ts').SessionHistorySingleton} */
export const SessionHistory = {
	init(config) {
		if (INSTANCE !== undefined) {
			throw new Error("History was already initialised");
		}
		INSTANCE = create(config);
	},
	observe() {
		if (INSTANCE === undefined) {
			throw new Error("History must be initialised first");
		}
		INSTANCE.observe();
	},
	disconnect() {
		if (INSTANCE === undefined) {
			throw new Error("History must be initialised first");
		}
		INSTANCE.disconnect();
	},
	navigate(url, options) {
		if (INSTANCE === undefined) {
			throw new Error("History must be initialised first");
		}
		return INSTANCE.navigate(url, options);
	},
	get scrollRestoration() {
		if (INSTANCE === undefined) {
			throw new Error("History must be initialised first");
		}

		return INSTANCE.scrollRestoration;
	},
	set scrollRestoration(value) {
		if (INSTANCE === undefined) {
			throw new Error("History must be initialised first");
		}

		INSTANCE.scrollRestoration = value;
	},
	addEventListener(type, listener) {
		if (INSTANCE === undefined) {
			throw new Error("History must be initialised first");
		}

		INSTANCE.addEventListener(type, listener);
	},
};

/**
 * @param {import("./SessionHistory.ts").SessionHistoryOptions} config
 * @returns {import("./SessionHistory.ts").SessionHistory}
 */
function create(config) {
	const enableViewTransition = config.enableViewTransition;
	history.scrollRestoration = "manual";

	const state = {
		scrollRestoration: config.scrollRestoration ?? "auto",
		/** @type {{ [K in keyof import("./SessionHistory.ts").SessionHistoryEvents]: import("./SessionHistory.ts").SessionHistoryListener<K>[] }} */
		listeners: {
			mount: [],
			unmount: [],
		},
		/** @type {import("./Navigation.ts").NavigationEndpoint} */
		currentHistoryState: history.state ?? {
			__frugal_history_id: Date.now().toString(36),
			url: location.href,
			data: undefined,
		},
		isFirstPageShow: true,
	};

	history.replaceState(state.currentHistoryState, "", location.href);
	_setPageScroll(state.currentHistoryState);

	_emit("mount", { type: "mount" });

	return {
		observe,
		disconnect,
		navigate,
		addEventListener,
		get scrollRestoration() {
			return state.scrollRestoration;
		},
		set scrollRestoration(value) {
			state.scrollRestoration = value;
		},
	};

	function observe() {
		window.addEventListener("popstate", _handlePopState);
		window.addEventListener("pagehide", _handlePageHide);
		window.addEventListener("pageshow", _handlePageShow);
	}

	function disconnect() {
		window.removeEventListener("popstate", _handlePopState);
		window.removeEventListener("pagehide", _handlePageHide);
		window.removeEventListener("pageshow", _handlePageShow);
	}

	/** @type {import('./SessionHistory.ts').SessionHistory['addEventListener']} */
	function addEventListener(type, listener) {
		state.listeners[type].push(/** @type {any} */ (listener));
	}

	/** @type {import('./SessionHistory.ts').SessionHistory['navigate']} */
	async function navigate(url, navigateConfig = {}) {
		if (!isHistoryState(history.state)) {
			return false;
		}

		/** @type {import('./Navigation.ts').NavigationEvent} */
		const navigationEvent = {
			from: history.state,
			to: {
				__frugal_history_id: Date.now().toString(36),
				url: new URL(url).href,
				data: navigateConfig.state,
			},
			cause: navigateConfig.replace ? "replace" : "push",
		};

		const fallback = navigateConfig.fallbackType ?? "native";
		const navigation = Navigation.create(navigationEvent, {
			navigationConfig: config.navigationConfig,
			fallback,
			scrollRestoration: state.scrollRestoration,
			useTransition: enableViewTransition ?? false,
		});

		navigation.addEventListener("mount", () => _emit("mount", { type: "mount" }));
		navigation.addEventListener("unmount", () => _emit("unmount", { type: "unmount" }));
		navigation.addEventListener("beforerender", () => {
			if (navigateConfig.replace) {
				history.replaceState(navigationEvent.to, "", navigationEvent.to.url);
			} else {
				history.pushState(navigationEvent.to, "", navigationEvent.to.url);
			}

			state.currentHistoryState = navigationEvent.to;
		});

		const success = await navigation.run(_setPageScroll, navigateConfig.init);
		if (!success && fallback === "native") {
			disconnect();
		}

		return success;
	}

	/**
	 * @param {PopStateEvent} event
	 */
	async function _handlePopState(event) {
		if (!isHistoryState(event.state)) {
			return;
		}

		/** @type {import("./Navigation.ts").NavigationEvent} */
		const navigationEvent = {
			from: state.currentHistoryState,
			to: event.state,
			cause: "popstate",
		};

		const navigation = Navigation.create(navigationEvent, {
			navigationConfig: config.navigationConfig,
			fallback: "native",
			scrollRestoration: state.scrollRestoration,
			useTransition: enableViewTransition ?? false,
		});

		navigation.addEventListener("mount", () => _emit("mount", { type: "mount" }));
		navigation.addEventListener("unmount", () => _emit("unmount", { type: "unmount" }));
		navigation.addEventListener("beforerender", () => {
			state.currentHistoryState = navigationEvent.to;
		});

		const success = await navigation.run(_setPageScroll);
		if (!success) {
			disconnect();
		}
	}

	async function _handlePageHide() {
		/** @type {import("./Navigation.ts").NavigationEvent} */
		const navigationEvent = {
			from: state.currentHistoryState,
			cause: "pagehide",
		};

		const navigation = Navigation.create(navigationEvent, {
			navigationConfig: config.navigationConfig,
			fallback: "native",
			scrollRestoration: state.scrollRestoration,
			useTransition: enableViewTransition ?? false,
		});

		navigation.addEventListener("mount", () => _emit("mount", { type: "mount" }));
		navigation.addEventListener("unmount", () => _emit("unmount", { type: "unmount" }));

		const success = await navigation.run(_setPageScroll);
		if (!success) {
			disconnect();
		}
	}

	async function _handlePageShow() {
		if (!isHistoryState(history.state)) {
			return;
		}

		const isFirstPageShow = state.isFirstPageShow;
		state.isFirstPageShow = false;

		/** @type {import("./Navigation.ts").NavigationEvent} */
		const navigationEvent = {
			to: history.state,
			cause: "pageshow",
		};

		const navigation = Navigation.create(navigationEvent, {
			navigationConfig: config.navigationConfig,
			fallback: isFirstPageShow ? "none" : "native",
			scrollRestoration: state.scrollRestoration,
			useTransition: !isFirstPageShow && (enableViewTransition ?? false),
		});

		navigation.addEventListener("mount", () => _emit("mount", { type: "mount" }));
		navigation.addEventListener("unmount", () => _emit("unmount", { type: "unmount" }));
		navigation.addEventListener("beforerender", () => {
			state.currentHistoryState = navigationEvent.to;
		});

		const success = await navigation.run(_setPageScroll);
		if (!success) {
			disconnect();
		}
	}

	/**
	 * @param {import("./Navigation.ts").NavigationEndpoint} historyState
	 */
	function _setPageScroll(historyState) {
		let scrollRestored = false;
		if (state.scrollRestoration === "auto") {
			scrollRestored = restoreScroll(historyState.__frugal_history_id);
		}
		if (!scrollRestored) {
			const url = new URL(historyState.url);
			if (url.hash.startsWith("#")) {
				const scrollTarget = document.querySelector(url.hash);
				if (scrollTarget !== null) {
					scrollTarget.scrollIntoView();
					return;
				}
			}
			window.scroll(0, 0);
		}
	}

	/**
	 * @template {keyof import("./SessionHistory.ts").SessionHistoryEvents} TYPE
	 * @param {TYPE} type
	 * @param {import("./SessionHistory.js").SessionHistoryEvents[TYPE]} event
	 */
	async function _emit(type, event) {
		const result = await Promise.allSettled(
			state.listeners[type].map(async (listener) => listener(event)),
		);

		for (const entry of result) {
			if (entry.status === "rejected") {
				console.error(new Error(`Error during ${type}`, { cause: entry.reason }));
			}
		}
	}
}

/**
 * @param {unknown} value
 * @returns {value is import("./Navigation.ts").NavigationEndpoint}
 */
function isHistoryState(value) {
	return (
		typeof value === "object" &&
		value !== null &&
		"__frugal_history_id" in value &&
		typeof value.__frugal_history_id === "string"
	);
}
