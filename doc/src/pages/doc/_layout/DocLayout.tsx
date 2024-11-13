import type { PageProps } from "@frugal-node/preact";
import { useLocation } from "@frugal-node/preact/client";
import { clsx } from "clsx";
import type * as preact from "preact";
import type { Lang, Version } from "../../../data/doc/config.ts";
import { type Toc, entryHref, nextEntry, previousEntry } from "../../../data/doc/toc.ts";
import { Carret } from "../../../glyphs/icons/Carret.tsx";
import { BaseLayout } from "../../_layout/BaseLayout.tsx";
import { Footer } from "../../_layout/Footer.tsx";
import { TopNavigation } from "../../_layout/TopNavigation.tsx";
import { SiteNav } from "../components/sitenav/SiteNav.tsx";
import * as docLayout from "./DocLayout.module.css";

type DocLayoutProps = PageProps & {
	children: preact.ComponentChildren;
	version: Version;
	lang: Lang;
	siteToc: Toc;
	pageToc: { label: string; id: string; level: number }[];
};

export function DocLayout({
	children,
	version,
	lang,
	siteToc,
	pageToc,
	...pageProps
}: DocLayoutProps) {
	const { pathname } = useLocation();

	const next = nextEntry(siteToc, version, lang, pathname);
	const previous = previousEntry(siteToc, version, lang, pathname);

	return (
		<BaseLayout {...pageProps}>
			<TopNavigation />

			<div class={clsx(docLayout["wrapper"])}>
				<SiteNav class={docLayout["siteNav"]} toc={siteToc} version={version} lang={lang} />

				<main class={clsx(docLayout["main"])}>
					{children}
					<nav class={clsx(docLayout["bottomNav"])}>
						{previous && (
							<a
								class={clsx(docLayout["previous"])}
								href={entryHref(previous, version, lang)}
							>
								<Carret class={clsx(docLayout["icon"])} $type="left" />
								{previous.title}
							</a>
						)}
						{next && (
							<a
								class={clsx(docLayout["next"])}
								href={entryHref(next, version, lang)}
							>
								{next.title}
								<Carret class={clsx(docLayout["icon"])} $type="right" />
							</a>
						)}
					</nav>
				</main>

				{/*<aside class={clsx(docLayout.pageNav)}>
					<PageTocIsland pageToc={pageToc} class={clsx(docLayout.fixed)} />
				</aside>*/}

				<Footer class={clsx(docLayout["footer"])} />
			</div>
		</BaseLayout>
	);
}
