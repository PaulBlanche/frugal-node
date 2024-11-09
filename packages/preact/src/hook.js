/** @import * as self from "./hook.js" */

import { options } from "preact";

/** @type {self.HOOK} */
export const HOOK = {
	HOOK: "__h",
	DIFF: "__b",
	DIFFED: "diffed",
	VNODE: "vnode",
	UNMOUNT: "unmount",
	RENDER: "__r",
	CATCH_ERROR: "__e",
};

/** @type {self.hook} */
export function hook(name, hook) {
	// @ts-ignore-next-line private options hooks usage
	options[name] = hook.bind(
		null,
		// @ts-ignore-next-line private options hooks usage
		options[name] ||
			(() => {
				// empty on purpose
			}),
	);
}
