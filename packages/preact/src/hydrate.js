import { hydrateIsland } from "./hydrateIsland.js";

/** @type {Record<DocumentReadyState, number>} */
const READYSTATE_ORDER = {
	loading: 0,
	interactive: 1,
	complete: 2,
};

/** @type {import('./hydrate.ts').hydrate} */
export function hydrate(name, getApp) {
	if (READYSTATE_ORDER[document.readyState] >= READYSTATE_ORDER["complete"]) {
		hydrateAll();
	} else {
		document.addEventListener("readystatechange", () => {
			if (document.readyState === "complete") {
				hydrateAll();
			}
		});
	}

	window.FRUGAL_SESSION_INSTANCE?.addEventListener("mount", hydrateAll);
	addEventListener("frugal:session", (event) => {
		event.detail.addEventListener("mount", hydrateAll);
	});

	function hydrateAll() {
		console.log("hydrateall");
		const hydratableOnLoad = queryHydratables(name, "load");
		if (hydratableOnLoad.length !== 0) {
			hydrateOnLoad(hydratableOnLoad, getApp);
		}

		const hydratableOnVisible = queryHydratables(name, "visible");
		if (hydratableOnVisible.length !== 0) {
			hydrateOnVisible(hydratableOnVisible, getApp);
		}

		const hydratableOnIdle = queryHydratables(name, "idle");
		if (hydratableOnIdle.length !== 0) {
			hydrateOnIdle(hydratableOnIdle, getApp);
		}

		const hydratableOnMediaQuery = queryHydratables(name, "media-query");
		if (hydratableOnMediaQuery.length !== 0) {
			hydrateOnMediaQuery(hydratableOnMediaQuery, getApp);
		}
	}
}

/**
 *
 * @param {string} name
 * @param {import('./Island.js').HydrationStrategy} strategy
 * @returns {NodeListOf<HTMLScriptElement>}
 */
export function queryHydratables(name, strategy) {
	return document.querySelectorAll(
		`script[data-hydratable="${name}"][data-hydration-strategy="${strategy}"]`,
	);
}

/**
 * hydrate immediatly
 * @template PROPS
 * @param {NodeListOf<HTMLScriptElement>} hydratables
 * @param {import('./hydrate.ts').GetApp<PROPS>} getApp
 */
function hydrateOnLoad(hydratables, getApp) {
	Array.from(hydratables).map(async (script) => {
		hydrateIsland(script, await getApp());
	});
}

/**
 * hydrate as soon as the main thread is idle
 * @template PROPS
 * @param {NodeListOf<HTMLScriptElement>} hydratables
 * @param {import('./hydrate.ts').GetApp<PROPS>} getApp
 */
function hydrateOnIdle(hydratables, getApp) {
	const idleCallback =
		typeof requestIdleCallback === "undefined"
			? /** @param {() => void} callback */ (callback) => setTimeout(callback, 1)
			: requestIdleCallback;

	idleCallback(async () => {
		Array.from(hydratables).map(async (root) => {
			hydrateIsland(root, await getApp());
		});
	});
}

/**
 * hydrate when the island enters the screen
 * @template PROPS
 * @param {NodeListOf<HTMLScriptElement>} hydratables
 * @param {import('./hydrate.ts').GetApp<PROPS>} getApp
 */
function hydrateOnVisible(hydratables, getApp) {
	const observer = new IntersectionObserver((entries, observer) => {
		entries.map(async (entry) => {
			if (
				entry.isIntersecting &&
				entry.target.previousElementSibling instanceof HTMLScriptElement
			) {
				hydrateIsland(entry.target.previousElementSibling, await getApp());
				observer.unobserve(entry.target);
			}
		});
	});

	for (const root of hydratables) {
		root.nextElementSibling && observer.observe(root.nextElementSibling);
	}
}

/**
 * hydrate on load if a media queries matches
 * @template PROPS
 * @param {NodeListOf<HTMLScriptElement>} hydratables
 * @param {import('./hydrate.ts').GetApp<PROPS>} getApp
 */
function hydrateOnMediaQuery(hydratables, getApp) {
	Array.from(hydratables).map(async (root) => {
		const query = root.dataset["hydrationQuery"];
		if (!query) {
			return;
		}

		const mediaQueryList = matchMedia(query);
		if (mediaQueryList.matches) {
			hydrateIsland(root, await getApp());
		} else {
			mediaQueryList.addEventListener("change", async (event) => {
				if (event.matches) {
					hydrateIsland(root, await getApp());
				}
			});
		}
	});
}
