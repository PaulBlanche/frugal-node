import * as preact from "preact";
import { Head } from "./Head.js";

export const pageDataContext =
	/** @type {typeof import('./PageDataProvider.ts').pageDataContext}*/
	(preact.createContext(undefined));

/** @type {import("./PageDataProvider.ts").PageDataProvider} */
export function PageDataProvider({ context, children }) {
	// server side we inject the serialized context in a script and wrap
	// the tree in a `dataContext.Provider` to forward data.
	if (typeof document === "undefined" && context) {
		const embedData = context.embedData ?? true;
		const script = `window.__FRUGAL__ = ${JSON.stringify({
			data: embedData ? context.data : undefined,
			embedData,
			location: context.location,
		})};`
			// needed because the context might contain html that could
			// accidentaly close the script early
			.replace(/<\/script>/g, "<\\/script>");
		return preact.h(
			preact.Fragment,
			{},
			preact.h(
				Head,
				{},
				context && preact.h("script", { dangerouslySetInnerHTML: { __html: script } }),
			),
			preact.h(pageDataContext.Provider, { value: { ...context, embedData } }, children),
		);
	}

	// client side we pick the context that was injected server side and wrap
	// the tree in a `dataContext.Provider` to forward data.
	return preact.h(pageDataContext.Provider, { value: window.__FRUGAL__.context }, children);
}
