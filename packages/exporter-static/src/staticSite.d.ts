import { Exporter } from "frugal-node/exporter";

export type StaticSiteMode = "index.html"; // |"nginx" | "apache";

export type StaticSiteConfig = {
	mode?: StaticSiteMode;
};

export function staticSite(config?: StaticSiteConfig): Exporter;
