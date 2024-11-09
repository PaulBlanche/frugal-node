import { Head, useLocation } from "@frugal-node/preact/client";
import { clsx } from "clsx";
import type { Lang, Version } from "../../../../data/doc/config.ts";
import { type TocHierarchy, entryHref, entryMatchHref } from "../../../../data/doc/toc.ts";
import * as content from "./Content.module.css";

type ContentProps = {
	version: Version;
	lang: Lang;
	hierarchies: TocHierarchy[];
};

export function Content({ hierarchies, version, lang }: ContentProps) {
	return (
		<ul class={content["tocList"]}>
			{hierarchies.map((child) => {
				return (
					<li key={child} class={content["tocItem"]}>
						<TocNode hierarchy={child} version={version} lang={lang} />
					</li>
				);
			})}
		</ul>
	);
}

type TocNodeProps = {
	version: Version;
	lang: Lang;
	hierarchy: TocHierarchy;
};

function TocNode({ hierarchy, version, lang }: TocNodeProps) {
	const { pathname } = useLocation();

	const entry = hierarchy.entry;
	const children = Object.values(hierarchy.children);

	const isActive = entryMatchHref(entry, version, lang, pathname);
	const href = entryHref(entry, version, lang);
	const isLinkable = entry.file || entry.link;

	return (
		<>
			{isActive && (
				<Head>
					<title>{entry.title}</title>
				</Head>
			)}
			{isLinkable ? (
				isActive ? (
					<span class={clsx(content["tocLinkActive"])}>{entry.title}</span>
				) : (
					<a class={clsx(content["tocLink"])} href={href}>
						{entry.title}
					</a>
				)
			) : (
				<span>{entry.title}</span>
			)}

			{children.length > 0 && (
				<Content hierarchies={children} version={version} lang={lang} />
			)}
		</>
	);
}
