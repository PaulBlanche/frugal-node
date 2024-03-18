import * as frugal from "../../../packages/frugal/exports/index.js";

/** @type {frugal.Config} */
export default {
	self: import.meta.url,
	pages: ["./page1.ts", "./page2.ts", "./page3.ts", "./page4.ts", "./page5.ts"],
	log: { level: "silent" },
	server: {
		port: 8004,
	},
};
