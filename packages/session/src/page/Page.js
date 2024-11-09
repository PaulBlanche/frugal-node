/** @import * as self from "./Page.js" */

import { shouldVisit } from "../utils.js";
import { render as _render } from "./render/render.js";

export const LOADING_CLASSNAME = "frugal-navigate-loading";

/** @type {self.PageCreator} */
export const Page = {
	create,
};

/** @type {self.PageCreator['create']} */
function create(url, config) {
	const state = {
		url: new URL(url),
	};

	return {
		get url() {
			return state.url.href;
		},
		render,
	};

	/** @type {self.Page['render']} */
	async function render(init) {
		try {
			const html = await _fetch(init);

			const nextDocument = new DOMParser().parseFromString(html, "text/html");

			if (!_shouldContinue(nextDocument)) {
				return { status: "aborted", reason: "meta directive in target document" };
			}

			await _render(nextDocument);

			return { status: "success" };
		} catch (error) {
			return { status: "failure", error };
		}
	}

	/**
	 *
	 * @param {Document} document
	 * @returns {boolean}
	 */
	function _shouldContinue(document) {
		const frugalVisitTypeMeta = document.querySelector('head meta[name="frugal-navigate"]');
		if (frugalVisitTypeMeta) {
			return shouldVisit(config.defaultNavigate, frugalVisitTypeMeta.getAttribute("content"));
		}

		return true;
	}

	/**
	 * @param {RequestInit} [init]
	 * @returns
	 */
	async function _fetch(init) {
		const handle = setTimeout(() => {
			document.body.classList.add(LOADING_CLASSNAME);
		}, config.timeout);

		const response = await fetch(state.url.href, init);

		if (response.redirected) {
			const hash = state.url.hash;
			state.url = new URL(response.url);
			state.url.hash = hash;
		}

		const html = await response.text();

		clearTimeout(handle);
		document.body.classList.remove(LOADING_CLASSNAME);

		return html;
	}
}
