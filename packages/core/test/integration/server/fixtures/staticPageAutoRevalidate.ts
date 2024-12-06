import {
	type BuildContext,
	type GenerateContext,
	PageResponse,
	type PathParamsList,
	type RenderContext,
} from "@frugal-node/core/page";
import { store } from "./store.ts";

export const route = "/static-revalidate/:slug";

type Data = {
	count: number;
	params: {
		slug: string;
	};
	store: string;
	searchParams: Record<string, string>;
};

export function getBuildPaths(): PathParamsList<typeof route> {
	return [{ slug: "1" }];
}

export async function build({
	params,
	session,
	request,
}: BuildContext<typeof route>): Promise<PageResponse<Data>> {
	const count = session?.get<number>("counter") ?? 0;

	return PageResponse.data(
		{
			params,
			count,
			store: await store(),
			searchParams: request
				? Object.fromEntries(new URL(request.url).searchParams.entries())
				: {},
		},
		{
			maxAge: 5,
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}

export function generate({
	session,
	request,
}: GenerateContext<typeof route>): PageResponse<Data> | undefined {
	if (request?.method === "POST") {
		const count = session?.get<number>("counter") ?? 0;
		session?.set("counter", count + 1);

		return PageResponse.empty({
			forceDynamic: true,
			status: 303,
			headers: {
				Location: request.url,
			},
		});
	}

	return undefined;
}

export function render({ data }: RenderContext<typeof route, Data>) {
	return JSON.stringify(data);
}
