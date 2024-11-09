import { serialize } from "@frugal-node/core/utils/serverData";
import * as preact from "preact";
import { Head } from "./Head.js";

export const pageDataContext =
	/** @type {typeof import('./PageDataProvider.ts').pageDataContext}*/
	(preact.createContext(undefined));

/** @type {import("./PageDataProvider.ts").ServerSidePageDataProvider} */
export function ServerSidePageDataProvider({ context, children }) {
	// server side we inject the serialized page data in a script and wrap
	// the tree in a `pageDataContext.Provider` to forward data.
	const pageData = context.embedData
		? {
				data: context.data,
				embedData: context.embedData,
				location: context.location,
			}
		: {
				embedData: context.embedData,
				location: context.location,
			};

	const script = `window.__FRUGAL__ = ${serialize({ pageData })};`;

	return preact.h(
		preact.Fragment,
		null,
		preact.h(
			Head,
			null,
			context &&
				preact.h("script", {
					["data-priority"]: -2,
					dangerouslySetInnerHTML: { __html: script },
				}),
		),
		preact.h(pageDataContext.Provider, { value: context }, children),
	);
}

/** @type {import("./PageDataProvider.ts").ClientSidePageDataProvider} */
export function ClientSidePageDataProvider({ children }) {
	// client side we pick the context that was injected server side and wrap
	// the tree in a `dataContext.Provider` to forward data.

	return preact.h(pageDataContext.Provider, { value: window.__FRUGAL__.pageData }, children);
}
