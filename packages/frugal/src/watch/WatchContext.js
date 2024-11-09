/** @import * as self from "./WatchContext.js" */

import { ChildContext } from "./ChildContext.js";
import { ParentContext } from "./ParentContext.js";

/** @type {self.WatchContextCreator} */
export const WatchContext = {
	create,
};

/** @type {self.WatchContextCreator['create']} */
function create(buildConfig, watchCache) {
	if (isInChildWatchProcess()) {
		return createWrapper(ChildContext.create(buildConfig, watchCache));
	}
	return createWrapper(ParentContext.create());
}

/**
 *
 * @param {ParentContext | ChildContext} context
 * @returns {self.WatchContext}
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

		watch() {
			return context.watch();
		},

		dispose() {
			return context.dispose();
		},
	};
}

export function isInChildWatchProcess() {
	return process.env["FRUGAL_WATCH_PROCESS_CHILD"] !== undefined;
}
