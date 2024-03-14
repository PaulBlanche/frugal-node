import * as preact from "preact";

export type DocumentProps = {
	head: preact.VNode[];
	dangerouslySetInnerHTML: { __html: string };
};

export type Document = preact.ComponentType<DocumentProps>;

export function DefaultDocument(props: DocumentProps): preact.VNode<any>;
