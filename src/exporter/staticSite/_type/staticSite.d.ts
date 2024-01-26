export type StaticSiteMode = "nginx" | "apache" | "index.html";

export type StaticSiteConfig = {
	mode: StaticSiteMode;
};
