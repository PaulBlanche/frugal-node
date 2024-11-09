import type { InternalBuildConfig } from "@frugal-node/core/config/build";
import type { CacheEntry, Exporter } from "@frugal-node/core/exporter";

export type StaticSiteMode = "index.html"; // |"nginx" | ;

export type StaticSiteConfig = {
	mode?: StaticSiteMode;
};

export function staticSite(config?: StaticSiteConfig): Exporter;

export type Entry = {
	mode: StaticSiteMode;
	config: InternalBuildConfig;
	entry: CacheEntry;
	body?: string | undefined;
};
