import type { PageAssets, Render } from "@frugal-node/core/page";
import type { ServerData } from "@frugal-node/core/utils/serverData";
import type * as preact from "preact";

export type DocumentProps = {
	head: preact.VNode[];
	dangerouslySetInnerHTML: { __html: string };
};

export type Document = preact.ComponentType<DocumentProps>;

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export function DefaultDocument(props: DocumentProps): preact.VNode<any>;

export type PageProps = {
	entrypoint: string;
	assets: PageAssets;
};

export type Page = preact.ComponentType<PageProps>;

type RenderConfig = {
	Document?: Document;
	embedData?: boolean;
};

export function getRenderFrom<PATH extends string, DATA extends ServerData>(
	Page: Page,
	config?: RenderConfig,
): Render<PATH, DATA>;
