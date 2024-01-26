import * as frugal from "../../../../../../index.js";
import { script } from "../../../../../../plugins/script/index.js";

/** @type {frugal.Config} */
export const config = {
	self: import.meta.url,
	pages: [],
	plugins: [script({})],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
