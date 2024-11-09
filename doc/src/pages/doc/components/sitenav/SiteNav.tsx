import { clsx } from "clsx";
import type { Lang, Version } from "../../../../data/doc/config.ts";
import type { Toc } from "../../../../data/doc/manifest.ts";
import { BaseNav } from "./BaseNav.tsx";
import * as siteNav from "./SiteNav.module.css";
import { MobileSiteNav } from "./mobile/MobileSiteNav.island.tsx";

export type SiteNavProps = {
	version: Version;
	lang: Lang;
	toc: Toc;
	class?: string;
};

export function SiteNav({ version, lang, toc, class: className }: SiteNavProps) {
	return (
		<>
			<BaseNav
				class={clsx(siteNav["desktop"], className)}
				toc={toc}
				version={version}
				lang={lang}
			/>
			<MobileSiteNav
				class={clsx(siteNav["mobile"], className)}
				toc={toc}
				version={version}
				lang={lang}
			/>
		</>
	);
}
