import type { ServerData } from "@frugal-node/core/utils/serverData";
import type * as preact from "preact";

export type PageDataContext = {
	data?: ServerData;
	location: { pathname: string; search: string };
	embedData: boolean;
};

export let pageDataContext: preact.Context<PageDataContext | undefined>;

export function ServerSidePageDataProvider(
	props: preact.RenderableProps<{ context: PageDataContext }>,
	// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
): preact.VNode<any>;

export function ClientSidePageDataProvider(
	// biome-ignore lint/complexity/noBannedTypes: don't care for this type
	props: preact.RenderableProps<{}>,
	// biome-ignore lint/suspicious/noExplicitAny: that's the return type of a preact function component
): preact.VNode<any>;

declare global {
	interface FrugalGlobal {
		pageData: {
			location: { pathname: string; search: string };
		} & (
			| {
					data: ServerData;
					embedData: true;
			  }
			| {
					embedData: false;
			  }
		);
		islands?: {
			instances: {
				[id: string]: {
					name: string;
					props: Record<string, ServerData> | undefined;
					parent?: Node;
					components?: Set<{ __P: Node }>;
				};
			};
			names: { [name: string]: string[] };
		};
	}

	var __FRUGAL__: FrugalGlobal;
}
