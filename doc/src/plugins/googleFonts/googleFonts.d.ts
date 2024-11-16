import type { Plugin } from "@frugal-node/core/plugin";

type Config = {
	type?: "local" | "external";
};

export function googleFonts(config?: Config): Plugin;
