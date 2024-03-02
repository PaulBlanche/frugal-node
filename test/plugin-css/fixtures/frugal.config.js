import { css } from "../../../packages/plugin-css/exports/index.js";

/** @type {import("../../../packages/frugal/exports/index.ts").Config} */
export const config = {
	self: import.meta.url,
	pages: [],
	plugins: [css()],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
