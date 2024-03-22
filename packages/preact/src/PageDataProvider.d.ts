import type * as preact from "preact";

export type PageDataContext = {
	data?: unknown;
	embedData: boolean;
	location: { pathname: string; search: string };
};

export let pageDataContext: preact.Context<PageDataContext | undefined>;

type PageDataProviderProps = {
	context?: {
		data?: unknown;
		location: { pathname: string; search: string };
		embedData?: boolean;
	};
};

export function PageDataProvider(
	props: preact.RenderableProps<PageDataProviderProps>,
	// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
): preact.VNode<any>;

declare global {
	interface FrugalGlobalNamespace {
		context: PageDataContext;
	}

	namespace globalThis {
		var __FRUGAL__: FrugalGlobalNamespace;
	}
}
