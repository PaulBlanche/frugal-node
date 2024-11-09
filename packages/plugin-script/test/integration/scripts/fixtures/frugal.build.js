/** @import { BuildConfig } from "@frugal-node/core/config/build";*/
import { script } from "@frugal-node/plugin-script";

/** @type {BuildConfig} */
export default {
	self: import.meta.url,
	pages: [],
	log: { level: "silent" },
	plugins: [
		script({
			esbuildOptions: {
				// disable hash in files to avoid test failure on different
				// environment with different hash seed
				chunkNames: "[name]",
				entryNames: "[name]",
				assetNames: "[name]",
			},
		}),
	],
};
