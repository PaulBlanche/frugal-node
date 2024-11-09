import type { Lang, Version } from "./config.ts";

export type Entry = { slug: string; title: string } & (
	| { file: URL; link?: undefined }
	| { file?: undefined; link: string }
);

export type Toc = {
	[version in Version]: {
		version: string;
		variables?: Record<string, string>;
		langs: {
			[lang in Lang]: {
				lang: { code: lang; name: string };
				variables?: Record<string, string>;
				entries: Entry[];
			};
		};
	};
};

export const TOC: Toc = {
	"1.0.0": {
		version: "1.0.0",
		variables: {
			NODE_VERSION: "22",
		},
		langs: {
			en: {
				lang: { code: "en", name: "english" },
				entries: [
					{
						slug: "introduction",
						title: "Introduction",
						file: new URL("./1.0.0/en/00-introduction.md", import.meta.url),
					},
					{
						slug: "getting-started",
						title: "Getting started",
						file: new URL("./1.0.0/en/01-getting-started.md", import.meta.url),
					},
					{
						slug: "getting-started/create-a-project",
						title: "Create a project",
						file: new URL(
							"./1.0.0/en/01-getting-started/00-create-a-project.md",
							import.meta.url,
						),
					},
					{
						slug: "getting-started/blog-posts",
						title: "Blog posts",
						file: new URL(
							"./1.0.0/en/01-getting-started/01-blog-posts.md",
							import.meta.url,
						),
					},
					{
						slug: "getting-started/styles-and-scripts",
						title: "Styles and scripts",
						file: new URL(
							"./1.0.0/en/01-getting-started/02-styles-and-scripts.md",
							import.meta.url,
						),
					},
					{
						slug: "getting-started/using-preact",
						title: "Using Preact",
						file: new URL(
							"./1.0.0/en/01-getting-started/03-using-preact.md",
							import.meta.url,
						),
					},
				],
			},
		},
	},
};
