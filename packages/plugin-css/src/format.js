/** @import * as self from "./format.js" */

/** @type {self.format} */
export function format(...classNames) {
	const list = classNames.flatMap((name) => name.split(" "));
	return [...new Set(list)].join(" ");
}
