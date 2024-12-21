import { type BuildContext, PageResponse, type PathParamsList } from "@frugal-node/core/page";
import { getRenderFrom } from "@frugal-node/preact";
import { DEFAULT_LANG } from "../../data/doc/toc.ts";
import { Page } from "./Page.tsx";

export const route = "/{:lang}";

export function getBuildPaths(): PathParamsList<typeof route> {
	return [{}, { lang: "fr" }];
}

export function build({ params: { lang = DEFAULT_LANG } }: BuildContext<typeof route>) {
	return PageResponse.data({ lang });
}

export const render = getRenderFrom(Page);
