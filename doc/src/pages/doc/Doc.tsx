import type { PageProps } from "@frugal-node/preact";
import { headManagerContext, useData } from "@frugal-node/preact/client";
import * as hooks from "preact/hooks";
import { parse } from "../../components/markdown/parse.ts";
import { DocLayout } from "./_layout/DocLayout.tsx";
import type { Data } from "./type.ts";

export function Doc(props: PageProps) {
	const headManager = hooks.useContext(headManagerContext);
	const { markdown, variables, version, lang, toc: siteToc } = useData<Data>();
	const { html, toc: pageToc } = parse(markdown, headManager, { ...variables, version });

	return (
		<DocLayout {...props} version={version} lang={lang} siteToc={siteToc} pageToc={pageToc}>
			{/* biome-ignore lint/security/noDangerouslySetInnerHtml: escaped by marked */}
			<div dangerouslySetInnerHTML={{ __html: html }} />
		</DocLayout>
	);
}
