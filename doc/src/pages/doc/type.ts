import type { Lang, Version } from "../../data/doc/config.ts";
import type { Toc } from "../../data/doc/manifest.ts";

export type Data = {
	toc: Toc;
	variables: Record<string, string>;
	version: Version;
	lang: Lang;
	markdown: string;
};
