import * as preact from "preact";

/** @type {import('./DefaultDocument.ts').DefaultDocument} */
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
