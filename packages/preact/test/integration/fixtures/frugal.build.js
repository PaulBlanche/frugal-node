import { script } from "../../../../plugin-script/exports/index.js";

/** @type {import("@frugal-node/core/config/build").BuildConfig} */
export default {
	self: import.meta.url,
	pages: ["./page1.ts", "./page2.ts", "./slot/page.ts"],
	log: { level: "silent" },
	esbuildOptions: {
		sourcemap: "inline",
	},
	plugins: [
		script({
			esbuildOptions: {
				// disable hash in files to avoid test failure on different
				// environment with different hash seed
				chunkNames: "[name]",
				entryNames: "[name]",
				assetNames: "[name]",
				splitting: false,
			},
		}),
	],
};
