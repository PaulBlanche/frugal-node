import type * as preact from "preact";
import { type Lang, VERSIONS, type Version } from "../../../../data/doc/config.ts";
import type { Toc } from "../../../../data/doc/manifest.ts";
import { getHierarchy } from "../../../../data/doc/toc.ts";
import { Content } from "./Content.tsx";
import { VersionSelector } from "./VersionSelector/VersionSelector.island.tsx";

export type BaseNavProps = preact.JSX.IntrinsicElements["nav"] & {
	version: Version;
	lang: Lang;
	toc: Toc;
};

export function BaseNav({ version, lang, toc, ...navProps }: BaseNavProps) {
	const hierarchy = getHierarchy(toc, version, lang);

	return (
		<nav {...navProps}>
			{VERSIONS.length > 1 && <VersionSelector version={version} />}

			<Content
				hierarchies={Object.values(hierarchy.children)}
				version={version}
				lang={lang}
			/>
		</nav>
	);
}
