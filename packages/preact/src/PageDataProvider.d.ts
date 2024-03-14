import * as preact from "preact";

export type PageDataContext = {
	data?: unknown;
	embedData: boolean;
};

export const pageDataContext: preact.Context<PageDataContext | undefined>;

type PageDataProviderProps = {
	context?: { data?: unknown };
	embedData?: boolean;
};

export function PageDataProvider(
	props: preact.RenderableProps<PageDataProviderProps>,
): preact.VNode<any>;

declare global {
	interface FrugalGlobalNamespace {
		context: {
			data?: unknown;
			embedData: boolean;
			pathname: string;
		};
	}

	namespace globalThis {
		// biome-ignore lint/style/noVar: only for types
		var __FRUGAL__: FrugalGlobalNamespace;
	}
}
