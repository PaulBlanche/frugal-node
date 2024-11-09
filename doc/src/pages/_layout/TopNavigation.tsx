import { useLocation } from "@frugal-node/preact/client";
import { clsx } from "clsx";
import { Github } from "../../glyphs/icons/Github.tsx";
import * as sr from "../../styles/screen-reader.module.css";
import * as navigation from "./TopNavigation.module.css";

export function TopNavigation() {
	const { pathname } = useLocation();

	const isHome = pathname === "/";
	const isDocs = pathname.includes("/doc@");
	const isBlog = pathname.startsWith("/blog");

	return (
		<nav class={clsx(navigation["navigation"])}>
			<div class={clsx(navigation["navigationContainer"])}>
				<a class={clsx(navigation["entry"], isHome && navigation["active"])} href="/">
					Home
				</a>
				<a
					class={clsx(navigation["entry"], isDocs && navigation["active"])}
					href={"/doc@latest"}
				>
					Docs
				</a>
				<a class={clsx(navigation["entry"], isBlog && navigation["active"])} href={"/blog"}>
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
