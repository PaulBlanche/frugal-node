export type StaticSiteMode = "index.html"; // |"nginx" | "apache";

export type StaticSiteConfig = {
	mode?: StaticSiteMode;
};
