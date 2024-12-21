import { LANGS, type Lang, type Version } from "./config.ts";
import { TOC } from "./manifest.ts";
import type { Entry, Toc } from "./manifest.ts";

export * from "./manifest.ts";

export const DEFAULT_VERSION = latest(TOC);

export const DEFAULT_LANG = LANGS[0];

export type TocHierarchy = {
	segment: string;
	entry: Entry;
	children: Record<string, TocHierarchy>;
};

export function getHierarchy(toc: Toc, version: Version, lang: Lang) {
	const hierarchy = { segment: "", children: {} } as TocHierarchy;

	const tocVersionLang = toc[version].langs[lang];

	for (const entry of tocVersionLang.entries) {
		const segments = entry.slug.split("/");
		let current = hierarchy;
		for (const segment of segments) {
			if (!(segment in current.children)) {
				current.children[segment] = { segment, children: {} } as TocHierarchy;
			}

			current = current.children[segment];
		}

		current.entry = entry;
	}

	for (const child of Object.values(hierarchy.children)) {
		validate(child);
	}

	return hierarchy;
}

function validate(hierarchy: TocHierarchy, current: string[] = []) {
	if (hierarchy.entry === undefined) {
		throw new Error(`Toc slug ${current.join("/")}/${hierarchy.segment} has no entry`);
	}

	for (const child of Object.values(hierarchy.children)) {
		validate(child, [hierarchy.segment]);
	}
}

export function latest(toc: Toc) {
	let latest = "0.0.0";
	for (const version of Object.keys(toc)) {
		const v = version.split(".");
		const l = latest.split(".");

		if (Number(v[0]) > Number(l[0])) {
			latest = version;
		}

		if (Number(v[0]) === Number(l[0])) {
			if (Number(v[1]) > Number(l[1])) {
				latest = version;
			}
			if (Number(v[1]) === Number(l[1])) {
				if (Number(v[2]) > Number(l[2])) {
					latest = version;
				}
			}
		}
	}

	return latest;
}

export function entryHref(entry: Entry, version: Version, lang: Lang) {
	if (entry.link) {
		return entry.link;
	}
	return `/${lang}/doc@${version}/${entry.slug}`;
}

export function entryMatchHref(entry: Entry, version: Version, lang: Lang, href: string) {
	const ownHref = entryHref(entry, version, lang);
	if (ownHref === `/${lang}/doc@${version}/introduction` && href === `/${lang}/doc@${version}`) {
		return true;
	}
	return href === ownHref;
}

export function nextEntry(toc: Toc, version: Version, lang: Lang, href: string) {
	const tocVersionLang = toc[version].langs[lang];
	const currentIndex = tocVersionLang.entries.findIndex((entry) =>
		entryMatchHref(entry, version, lang, href),
	);

	let nextIndex = currentIndex + 1;
	while (nextIndex < tocVersionLang.entries.length) {
		if (tocVersionLang.entries[nextIndex].file || tocVersionLang.entries[nextIndex].link) {
			return tocVersionLang.entries[nextIndex];
		}
		nextIndex += 1;
	}

	return undefined;
}

export function previousEntry(toc: Toc, version: Version, lang: Lang, href: string) {
	const tocVersionLang = toc[version].langs[lang];
	const currentIndex = tocVersionLang.entries.findIndex((entry) =>
		entryMatchHref(entry, version, lang, href),
	);

	let previousIndex = currentIndex - 1;
	while (previousIndex > -1) {
		if (
			tocVersionLang.entries[previousIndex].file ||
			tocVersionLang.entries[previousIndex].link
		) {
			return tocVersionLang.entries[previousIndex];
		}
		previousIndex -= 1;
	}

	return undefined;
}
