/** @import { NavigationConfig } from "./page/Page.js" */
/** @import { PrefetchConfig } from "./prefetch/Prefetcher.js" */

import { SessionHistory } from "./SessionHistory.js";
import { Form } from "./form/Form.js";
import { SubmitObserver } from "./form/SubmitObserver.js";
import { Submitter } from "./form/Submitter.js";
import { NavigationObserver } from "./navigation/NavigationObserver.js";
import { PrefetchObserver } from "./prefetch/PrefetchObserver.js";
import * as utils from "./utils.js";

/** @type {import("./Session.ts").Session|undefined} */
let INSTANCE = undefined;

/** @type {import('./Session.ts').SessionSingleton} */
export const Session = {
	init(config) {
		if (INSTANCE !== undefined) {
			throw new Error("History was already initialised");
		}
		INSTANCE = create(config);
		dispatchEvent(new CustomEvent("frugal:session", { detail: INSTANCE }));
	},
	observe() {
		if (INSTANCE === undefined) {
			throw new Error("Session must be initialised first");
		}
		INSTANCE.observe();
	},
	disconnect() {
		if (INSTANCE === undefined) {
			throw new Error("Session must be initialised first");
		}
		INSTANCE.disconnect();
	},
	navigate(url, config) {
		if (INSTANCE === undefined) {
			throw new Error("Session must be initialised first");
		}
		return INSTANCE.navigate(url, config);
	},
	submit(form) {
		if (INSTANCE === undefined) {
			throw new Error("Session must be initialised first");
		}
		return INSTANCE.submit(form);
	},
	addEventListener(type, listener) {
		if (INSTANCE === undefined) {
			throw new Error("Session must be initialised first");
		}
		return INSTANCE.addEventListener(type, listener);
	},
	removeEventListener(type, listener) {
		if (INSTANCE === undefined) {
			throw new Error("Session must be initialised first");
		}
		return INSTANCE.removeEventListener(type, listener);
	},
};

if (typeof document !== "undefined") {
	window.FRUGAL_SESSION_INSTANCE = Session;
}
/**
 *
 * @param {import("./Session.ts").SessionConfig} [config]
 * @returns {import("./Session.ts").Session}
 */
function create(config) {
	/** @type {NavigationConfig} */
	const navigationConfig = {
		defaultNavigate: config?.navigation?.defaultNavigate ?? true,
		timeout: config?.navigation?.timeout ?? 150,
	};

	/** @type {PrefetchConfig} */
	const prefetchConfig = {
		defaultPrefetch: config?.prefetch?.defaultPrefetch ?? true,
		timeout: config?.prefetch?.timeout ?? 80,
		cooldown: config?.prefetch?.cooldown ?? 1000,
	};

	const navigationObserver = NavigationObserver.create(navigationConfig);
	const submitObserver = SubmitObserver.create(navigationConfig);
	const prefetchObserver = PrefetchObserver.create(prefetchConfig);

	SessionHistory.init({
		enableViewTransition: config?.navigation?.enableViewTransition ?? true,
		scrollRestoration: config?.navigation?.scrollRestoration ?? "auto",
		navigationConfig,
	});

	return {
		observe() {
			SessionHistory.observe();
			navigationObserver.observe();
			submitObserver.observe();
			prefetchObserver.observe();
		},
		disconnect() {
			SessionHistory.disconnect();
			navigationObserver.disconnect();
			submitObserver.disconnect();
			prefetchObserver.disconnect();
		},
		navigate(url, options) {
			if (!utils.isInternalUrl(url)) {
				location.assign(url);
			}
			return SessionHistory.navigate(url, { ...options, fallbackType: "throw" });
		},
		async submit(formElement) {
			const form = Form.create(formElement);
			const submiter = Submitter.create(form, navigationConfig);

			const result = await submiter.submit();

			if (result.status === "aborted") {
				console.log(`Navigation aborted: ${result.reason}`);
				this.disconnect();
				form.submit();
			}
			if (result.status === "failure") {
				console.error(new Error("Navigation failure", { cause: result.error }));
				this.disconnect();
				form.submit();
			}
		},
		addEventListener(type, listener) {
			SessionHistory.addEventListener(type, listener);
		},
		removeEventListener(type, listener) {
			SessionHistory.removeEventListener(type, listener);
		},
	};
}
