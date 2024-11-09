import { BuildConfig } from "../../../../exports/config/build.js";

/** @type {BuildConfig} */
export default {
	self: import.meta.url,
	pages: ["./page1.ts", "./page2.ts"],
	log: { level: "info" },
};
