import type * as preact from "preact";

export type DocumentProps = {
	head: preact.VNode[];
	dangerouslySetInnerHTML: { __html: string };
};

export type Document = preact.ComponentType<DocumentProps>;

// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
export function DefaultDocument(props: DocumentProps): preact.VNode<any>;
