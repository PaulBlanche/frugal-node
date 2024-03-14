import * as preact from "preact";
import * as server from "preact-render-to-string";
import { DefaultDocument } from "./DefaultDocument.js";
import { HeadProvider } from "./Head.js";
import { ISLAND_END } from "./Island.js";
import { PageDataProvider } from "./PageDataProvider.js";

/**@type {import('./getRenderFrom.ts').getRenderFrom} */
export function getRenderFrom(Page, { Document = DefaultDocument, embedData = false } = {}) {
	return ({ data, descriptor, assets }) => {
		/** @type {preact.VNode[]} */
		let head = [];

		const html = render(
			preact.h(
				HeadProvider,
				{
					onHeadUpdate: (nextHead) => {
						head = nextHead;
					},
				},
				preact.h(
					PageDataProvider,
					{ context: { data }, embedData },
					preact.h(Page, { descriptor: descriptor, assets: assets }),
				),
			),
		);

		return `<!DOCTYPE html>${render(
			preact.h(Document, {
				head,
				dangerouslySetInnerHTML: { __html: html },
			}),
		).replace(`</!--${ISLAND_END}-->`, "")}`;
	};
}

// FIXME(whiteshoulders): investigate why server.render return a string array instead of a string
/**
 * @param {preact.VNode} vnode
 * @returns {string}
 */
function render(vnode) {
	const result = server.render(vnode);
	if (Array.isArray(result)) {
		return result.join("");
	}
	return result;
}
