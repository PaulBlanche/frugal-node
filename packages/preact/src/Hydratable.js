import * as preact from "preact";
import { HeadProvider } from "./Head.js";
import { PageDataProvider } from "./PageDataProvider.js";

/** @type {import('./Hydratable.ts').Hydratable} */
export function Hydratable({ App, props }) {
	return preact.h(
		PageDataProvider,
		{},
		preact.h(
			HeadProvider,
			{
				onHeadUpdate: (nextHead) => {
					preact.render(nextHead, document.head);
				},
			},
			preact.h(App, props),
		),
	);
}
