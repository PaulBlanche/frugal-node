import * as url from "node:url";
import { type BuildContext, PageResponse, type PathParamsList } from "@frugal-node/core/page";
import * as fs from "@frugal-node/core/utils/fs";
import { getRenderFrom } from "@frugal-node/preact";
import { isValidLang, isValidVersion } from "../../data/doc/config.ts";
import { DEFAULT_LANG, DEFAULT_VERSION, TOC } from "../../data/doc/toc.ts";
import { Doc } from "./Doc.tsx";
import type { Data } from "./type.ts";

export const route = "/{:lang/}doc{@:version}{/*slug}";

export function getBuildPaths(): PathParamsList<typeof route> {
	const paths: PathParamsList<typeof route> = [];

	for (const [version, versionToc] of Object.entries(TOC)) {
		for (const [lang, langToc] of Object.entries(versionToc.langs)) {
			for (const entry of langToc.entries) {
				const slug = entry.slug.split("/");
				paths.push({
					lang: lang === DEFAULT_LANG ? undefined : lang,
					version: version === DEFAULT_VERSION ? undefined : version,
					slug: slug.length === 1 && slug[0] === "introduction" ? undefined : slug,
				});
			}
		}
	}

	return paths;
}

export async function build({
	params: { slug = ["introduction"], version = DEFAULT_VERSION, lang = DEFAULT_LANG },
}: BuildContext<typeof route>) {
	if (!(isValidLang(lang) && isValidVersion(version))) {
		return PageResponse.empty({ status: 404 });
	}

	const variables = { ...TOC[version].variables, ...TOC[version].langs[lang].variables };

	const entry = TOC[version].langs[lang].entries.find((entry) => entry.slug === slug.join("/"));

	if (entry === undefined || entry.file === undefined) {
		return PageResponse.empty({ status: 404 });
	}

	const markdown = await fs.readTextFile(url.fileURLToPath(entry.file));

	return PageResponse.data<Data>(
		{
			toc: TOC,
			variables,
			version,
			lang,
			markdown,
		},
		{
			maxAge: 5,
			headers: {
				"Cache-Control": "public, max-age=300, must-revalidate", // cached for 5min
			},
		},
	);
}

export const render = getRenderFrom(Doc);
