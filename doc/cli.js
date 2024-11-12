/** @import { BuildConfig } from "@frugal-node/core/config/build";*/

import { build, context } from "@frugal-node/core";
import { vercel } from "@frugal-node/exporter-vercel";
import { css } from "@frugal-node/plugin-css";
import { script } from "@frugal-node/plugin-script";
import { svg } from "./src/plugins/svg/svg.js";

/** @type {BuildConfig} */
const config = {
	self: import.meta.url,
	pages: ["./src/pages/home/page.ts", "./src/pages/doc/page.ts"],
	log: {
		level: "verbose",
	},
	exporter: vercel({ outdir: "../" }),
	runtimeConfigPath: "./frugal.config.ts",
	plugins: [css({ globalCss: "./src/global.css", cssModule: true }), script(), svg({})],
};

if (process.argv[2] === "build") {
	await build(config);
}

if (process.argv[2] === "dev") {
	(await context(config)).watch();
}
