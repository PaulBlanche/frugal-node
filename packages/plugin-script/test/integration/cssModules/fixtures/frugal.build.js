import { css } from "@frugal-node/plugin-css";
/** @import { BuildConfig } from "@frugal-node/core/config/build";*/
import { script } from "@frugal-node/plugin-script";

/** @type {BuildConfig} */
export default {
	self: import.meta.url,
	log: { level: "silent" },
	esbuildOptions: {
		// disable hash in files to avoid test failure on different
		// environment with different hash seed
		// @ts-expect-error
		chunkNames: "[name]",
		entryNames: "[name]",
		assetNames: "[name]",
	},
	pages: ["cssModules/page.ts"],
	plugins: [
		script({
			esbuildOptions: {
				minify: false,
				// disable hash in files to avoid test failure on different
				// environment with different hash seed
				chunkNames: "[name]",
				entryNames: "[name]",
				assetNames: "[name]",
			},
		}),
		css({
			cssModule: true,
			esbuildOptions: {
				minify: false,
				// disable hash in files to avoid test failure on different
				// environment with different hash seed
				chunkNames: "[name]",
				entryNames: "[name]",
				assetNames: "[name]",
			},
		}),
	],
};
