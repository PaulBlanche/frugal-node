import * as frugal from "../../../../../../index.js";
import { css } from "../../../../../../plugins/css/index.js";

/** @type {frugal.Config} */
export const config = {
	self: import.meta.url,
	pages: [],
	plugins: [css()],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
