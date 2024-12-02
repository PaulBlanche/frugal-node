/** @import { BuildConfig } from "@frugal-node/core/config/build";*/

import { parseArgs, parseEnv } from "node:util";
import { build, context } from "@frugal-node/core";
import { vercel } from "@frugal-node/exporter-vercel";
import { css } from "@frugal-node/plugin-css";
import { script } from "@frugal-node/plugin-script";
import { googleFonts } from "./src/plugins/googleFonts/googleFonts.js";
import { svg } from "./src/plugins/svg/svg.js";

const args = parseArgs({
	options: {
		local: {
			type: "boolean",
			default: false,
			short: "l",
		},
	},
	allowPositionals: true,
});

/** @type {BuildConfig} */
const config = {
	self: import.meta.url,
	pages: ["./src/pages/home/page.ts", "./src/pages/doc/page.ts"],
	log: {
		level: "verbose",
	},
	exporter: vercel({ outdir: "../" }),
	runtimeConfigPath: "./frugal.config.ts",
	plugins: [
		css({
			globalCss: "./src/global.css",
			cssModule: true,
		}),
		script({}),
		svg({}),
		googleFonts({}),
	],
};

if (args.values.local) {
	const dotenvx = await import("@dotenvx/dotenvx");
	dotenvx.config({
		path: ["./.env.local"],
	});
}

if (args.positionals[0] === "build") {
	await build(config);
}

if (args.positionals[0] === "dev") {
	(await context(config)).watch();
}
