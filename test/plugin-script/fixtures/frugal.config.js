import { script } from "../../../packages/plugin-script/exports/index.js";

/** @type {import("../../../packages/frugal/exports/index.js").Config} */
export const config = {
	self: import.meta.url,
	pages: [],
	plugins: [script({})],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
