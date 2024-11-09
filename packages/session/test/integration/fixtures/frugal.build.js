import { script } from "../../../../plugin-script/exports/index.js";

/** @type {import("@frugal-node/core/config/build").BuildConfig} */
export default {
	self: import.meta.url,
	pages: [
		"./page1.ts",
		"./page2.ts",
		"./page3.ts",
		"./page4.ts",
		"./page5.ts",
		"./page6.ts",
		"./page7.ts",
	],
	log: { level: "silent" },
	plugins: [script()],
};
