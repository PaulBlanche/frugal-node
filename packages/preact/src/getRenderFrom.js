/** @import * as self from "./getRenderFrom.js" */

import * as preact from "preact";
import * as server from "preact-render-to-string";
import { HeadProvider } from "./Head.js";
import { ServerSidePageDataProvider } from "./PageDataProvider.js";

/**@type {self.getRenderFrom} */
export function getRenderFrom(Page, { Document = DefaultDocument, embedData = false } = {}) {
	return ({ data, entrypoint, assets, location }) => {
		/** @type {preact.VNode[]} */
		let head = [];

		const html = server.render(
			preact.h(
				HeadProvider,
				{
					onHeadUpdate: (nextHead) => {
						head = nextHead;
					},
				},
				preact.h(
					ServerSidePageDataProvider,
					{ context: { data, embedData, location } },
					preact.h(Page, { entrypoint, assets }),
				),
			),
		);

		return `<!DOCTYPE html>${server
			.render(
				preact.h(Document, {
					head,
					dangerouslySetInnerHTML: { __html: html },
				}),
			)
			.replace(/<\/!--frugal-island:start:.+?-->/g, "")
			.replace(/<\/!--frugal-island:end:.+?-->/g, "")
			.replace(/<\/!--frugal-slot:start:.+?-->/g, "")
			.replace(/<\/!--frugal-slot:end:.+?-->/g, "")}`;
	};
}

/** @type {self.DefaultDocument} */
export function DefaultDocument({ head: state, dangerouslySetInnerHTML }) {
	const htmls = state.filter((node) => node.type === "html");
	const bodys = state.filter((node) => node.type === "body");
	const head = state.filter((node) => node.type !== "html");

	const htmlProps = {};
	for (const html of htmls) {
		Object.assign(htmlProps, html.props);
	}

	const bodyProps = {};
	for (const body of bodys) {
		Object.assign(bodyProps, body.props);
	}

	return preact.h(
		"html",
		htmlProps,
		preact.h("head", {}, head),
		preact.h("body", { ...bodyProps, dangerouslySetInnerHTML }),
	);
}
