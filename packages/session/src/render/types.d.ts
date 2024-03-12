export type NodePatch =
	| { type: typeof PatchType.PRESERVE_NODE }
	| { type: typeof PatchType.REMOVE_NODE }
	| { type: typeof PatchType.APPEND_NODE; node: Node }
	| { type: typeof PatchType.REPLACE_NODE; node: Node }
	| { type: typeof PatchType.UPDATE_TEXT; text: string }
	| UpdateElementPatch;

export type UpdateElementPatch = {
	type: typeof PatchType.UPDATE_ELEMENT;
	children: NodePatch[];
	attributes: AttributePatch[];
};

export type AttributePatch =
	| { type: typeof PatchType.REMOVE_ATTRIBUTE; name: string }
	| { type: typeof PatchType.SET_ATTRIBUTE; name: string; value: string | true };

export const PatchType: {
	PRESERVE_NODE: 0;
	REMOVE_NODE: 1;
	APPEND_NODE: 2;
	REPLACE_NODE: 3;
	UPDATE_TEXT: 4;
	UPDATE_ELEMENT: 5;
	REMOVE_ATTRIBUTE: 6;
	SET_ATTRIBUTE: 7;
};

export const NodeType: {
	ELEMENT_NODE: 1;
	TEXT_NODE: 3;
	DOCUMENT_NODE: 9;
	COMMENT_NODE: 8;
};
