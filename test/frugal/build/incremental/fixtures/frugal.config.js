import * as frugal from "../../../../../packages/frugal/exports/index.js";

/** @type {frugal.Config} */
export const config = {
	self: import.meta.url,
	pages: ["./page1.ts", "./page2.ts"],
	log: { level: "silent" },
	cleanAllOutDir: false,
};
