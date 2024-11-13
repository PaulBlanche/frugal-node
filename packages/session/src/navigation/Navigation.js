/** @import * as self from "./Navigation.js" */
/** @import { NonSuccessPageResult } from "../page/Page.js" */

import { Page } from "../page/Page.js";
import { saveScroll } from "../scroll.js";
import * as utils from "../utils.js";

/**@type {self.NavigationCreator} */
export const Navigation = {
	create,
};

/** @type {self.NavigationCreator['create']} */
function create(event, config) {
	const state = {
		continue: true,
		/** @type {{[K in keyof self.NavigationEvents]: self.NavigationListener<K>[]}} */
		listeners: {
			mount: [],
			unmount: [],
			beforerender: [],
		},
	};

	return {
		run,
		addEventListener,
	};

	/** @type {self.Navigation['run']} */
	async function run(setPageScroll, init) {
		const shouldContinue = dispatchEvent(
			new CustomEvent("frugal:navigation", {
				cancelable: true,
				detail: {
					type: "start",
					...event,
				},
			}),
		);

		if (!shouldContinue) {
			_fallback(event, { status: "aborted", reason: "frugal:navigation start canceled" });
			return false;
		}

		if (event.from) {
			saveScroll(event.from.__frugal_history_id);
		}

		await wrapInViewTransition(
			async () => {
				if (event.cause !== "pageshow") {
					await _emit("unmount", { type: "unmount" });
				}

				await _emit("beforerender", { type: "beforerender" });

				await _render(event, init);

				if (!state.continue) {
					return;
				}

				if (event.to) {
					setPageScroll(event.to);
				}

				if (event.cause !== "pagehide") {
					await _emit("mount", { type: "mount" });
				}
			},
			{ useTransition: config.useTransition },
		);

		if (!state.continue) {
			return false;
		}

		dispatchEvent(
			new CustomEvent("frugal:navigation", {
				cancelable: true,
				detail: {
					type: "end",
					...event,
				},
			}),
		);

		return true;
	}

	/** @type {self.Navigation['addEventListener']} */
	function addEventListener(type, listener) {
		state.listeners[type].push(/** @type {any} */ (listener));
	}

	/**
	 * @param {self.NavigationEvent} event
	 * @param {RequestInit} [init]
	 * @returns
	 */
	async function _render(event, init) {
		if (event.cause === "pagehide") {
			return;
		}

		if (utils.isUrlForSameDocument(event.from?.url ?? location.href, event.to.url)) {
			return;
		}

		const page = Page.create(event.to.url, config.navigationConfig);
		const result = await page.render(init);

		if (result.status !== "success") {
			_fallback(event, result);
		}
	}

	/**
	 * @param {self.NavigationEvent} event
	 * @param {NonSuccessPageResult} result
	 */
	function _fallback(event, result) {
		state.continue = false;

		if (config.fallback === "throw" && result.status === "failure") {
			throw new Error("Navigation failure", { cause: result.error });
		}

		if (config.fallback === "native") {
			switch (event.cause) {
				case "popstate":
				case "push":
				case "replace": {
					location.assign(event.to.url);
					break;
				}
				case "pageshow": {
					location.reload();
					break;
				}
			}
		}
	}

	/**
	 * @template {keyof self.NavigationEvents} TYPE
	 * @param {TYPE} type
	 * @param {self.NavigationEvents[TYPE]} event
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
 * @param {() => Promise<void>} callback
 * @param {{ useTransition: boolean }} options
 */
async function wrapInViewTransition(callback, { useTransition }) {
	if (!(document["startViewTransition"] && useTransition)) {
		return await callback();
	}
	const transition = document.startViewTransition(callback);
	await transition.finished;
}
