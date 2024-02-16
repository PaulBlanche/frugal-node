import * as frugal from "../../../packages/frugal/exports/index.js";
import { css } from "../../../packages/plugin-css/exports/index.js";

/** @type {frugal.Config} */
export const config = {
	self: import.meta.url,
	pages: [],
	plugins: [css()],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
