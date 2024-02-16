import * as frugal from "../../../../packages/frugal/exports/index.js";

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
}: frugal.GenerateContext<typeof route>): frugal.DataResponse<Data> {
	const count = session?.get<number>("counter") ?? 0;
	session?.set("counter", count + 1);

	return new frugal.DataResponse(
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

export function render({ data }: frugal.RenderContext<typeof route, Data>) {
	return JSON.stringify(data);
}
