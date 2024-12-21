import { useLocation } from "@frugal-node/preact/client";
import { clsx } from "clsx";
import type { Lang } from "../../data/doc/config.ts";
import { DEFAULT_LANG } from "../../data/doc/toc.ts";
import { Github } from "../../glyphs/icons/Github.tsx";
import * as sr from "../../styles/screen-reader.module.css";
import * as navigation from "./TopNavigation.module.css";

type TopNavigationProps = { lang: Lang };

export function TopNavigation({ lang }: TopNavigationProps) {
	const { pathname } = useLocation();

	const pathLang = lang === DEFAULT_LANG ? "" : lang;
	const homePath = lang === DEFAULT_LANG ? "/" : `/${pathLang}`;
	const docPath = lang === DEFAULT_LANG ? "/doc" : `/${pathLang}/doc`;
	const blogPath = lang === DEFAULT_LANG ? "/blog" : `/${pathLang}/blog`;

	const isHome = pathname === homePath;
	const isDocs = pathname.startsWith(docPath);
	const isBlog = pathname.startsWith(blogPath);

	return (
		<nav class={clsx(navigation["navigation"])}>
			<div class={clsx(navigation["navigationContainer"])}>
				<a
					class={clsx(navigation["entry"], isHome && navigation["active"])}
					href={homePath}
				>
					Home
				</a>
				<a class={clsx(navigation["entry"], isDocs && navigation["active"])} href={docPath}>
					Docs
				</a>
				<a
					class={clsx(navigation["entry"], isBlog && navigation["active"])}
					href={blogPath}
				>
					Blog
				</a>
			</div>
			<a
				class={clsx(navigation["githubLink"])}
				href="https://github.com/PaulBlanche/frugal"
				aria-label="Source code on Github"
			>
				<span class={sr["hidden"]}>Github</span>
				<Github width="16" class={clsx(navigation["icon"])} aria-hidden="true" />
			</a>
		</nav>
	);
}
