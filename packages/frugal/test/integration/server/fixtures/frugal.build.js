import { BuildConfig } from "../../../../exports/config/build.js";

/** @type {BuildConfig} */
export default {
	self: import.meta.url,
	pages: ["./dynamicPage.ts", "./staticPage.ts", "./staticPageJIT.ts"],
	log: { level: "silent" },
};
