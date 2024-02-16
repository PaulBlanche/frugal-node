import * as frugal from "../../../packages/frugal/exports/index.js";
import { script } from "../../../packages/plugin-script/exports/index.js";

/** @type {frugal.Config} */
export const config = {
	self: import.meta.url,
	pages: [],
	plugins: [script({})],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
