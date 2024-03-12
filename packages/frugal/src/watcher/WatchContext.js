import { ChildContext } from "./ChildContext.js";
import { ParentContext } from "./ParentContext.js";

/** @type {import('./WatchContext.ts').WatchContextMaker} */
export const WatchContext = {
	create,
};

/** @type {import('./WatchContext.ts').WatchContextMaker['create']} */
export function create(config, buildConfig, watchCache) {
	if (isInChildWatchProcess()) {
		return createWrapper(ChildContext.create(config, buildConfig, watchCache));
	}
	return createWrapper(ParentContext.create());
}

/**
 *
 * @param {import("./ParentContext.js").ParentContext | import("./ChildContext.js").ChildContext} context
 * @returns {import('./WatchContext.ts').WatchContext}
 */
function createWrapper(context) {
	return {
		addEventListener(listener) {
			if ("addEventListener" in context) {
				context.addEventListener(listener);
			}
		},

		removeEventListener(listener) {
			if ("removeEventListener" in context) {
				context.removeEventListener(listener);
			}
		},

		watch(options) {
			return context.watch(options);
		},

		dispose() {
			return context.dispose();
		},
	};
}

export function isInChildWatchProcess() {
	return process.env["FRUGAL_WATCH_PROCESS_CHILD"] !== undefined;
}
