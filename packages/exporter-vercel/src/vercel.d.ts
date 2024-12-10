import type { Exporter } from "@frugal-node/core/exporter";

type Config = {
	outdir?: string;
};

export function vercel(config?: Config): Exporter;
