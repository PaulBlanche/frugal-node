/** @type {typeof import('./types.ts').PatchType} */
export const PatchType = {
	PRESERVE_NODE: 0,
	REMOVE_NODE: 1,
	APPEND_NODE: 2,
	REPLACE_NODE: 3,
	UPDATE_TEXT: 4,
	UPDATE_ELEMENT: 5,
	REMOVE_ATTRIBUTE: 6,
	SET_ATTRIBUTE: 7,
};

/** @type {typeof import('./types.ts').NodeType} */
export const NodeType = {
	ELEMENT_NODE: 1,
	TEXT_NODE: 3,
	DOCUMENT_NODE: 9,
	COMMENT_NODE: 8,
};
