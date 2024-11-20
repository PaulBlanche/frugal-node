import type { Exporter } from "@frugal-node/core/exporter";

type Config = {
	outdir?: string;
	populate?: boolean;
};

export function vercel(config?: Config): Exporter;
