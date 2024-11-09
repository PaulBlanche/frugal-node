import { type GenerateContext, PageResponse, type RenderContext } from "@frugal-node/core/page";

export const type = "dynamic";

export const route = "/dynamic/:slug";

type Data = {
	count: number;
	params: {
		slug: string;
	};
	searchParams: Record<string, string>;
};

export function generate({
	params,
	request,
	session,
}: GenerateContext<typeof route>): PageResponse<Data> {
	const count = session?.get<number>("counter") ?? 0;
	session?.set("counter", count + 1);

	return PageResponse.data(
		{
			params,
			count,
			searchParams: Object.fromEntries(new URL(request.url).searchParams.entries()),
		},
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}

export function render({ data }: RenderContext<typeof route, Data>) {
	return JSON.stringify(data);
}
