/** @import { BuildConfig } from "@frugal-node/core/config/build";*/

import { css } from "@frugal-node/plugin-css";

/** @type {BuildConfig} */
export default {
	self: import.meta.url,
	pages: [],
	log: { level: "silent" },
	esbuildOptions: {
		// disable hash in files to avoid test failure on different
		// environment with different hash seed
		// @ts-expect-error
		chunkNames: "[name]",
		entryNames: "[name]",
		assetNames: "[name]",
	},
	plugins: [
		css({
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
