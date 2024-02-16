import * as frugal from "../../../../packages/frugal/exports/index.js";
import { store } from "./store.ts";

export const route = "/static/:slug";

type Data = {
	count: number;
	params: {
		slug: string;
	};
	store: string;
	searchParams: Record<string, string>;
};

export function getBuildPaths(): frugal.PathList<typeof route> {
	return [{ slug: "1" }];
}

export async function build({
	params,
	session,
	request,
}: frugal.BuildContext<typeof route>): Promise<frugal.PageResponse<Data>> {
	const count = session?.get<number>("counter") ?? 0;

	return new frugal.DataResponse(
		{
			params,
			count,
			store: await store(),
			searchParams: request
				? Object.fromEntries(new URL(request.url).searchParams.entries())
				: {},
		},
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}

export function generate({
	session,
	request,
}: frugal.GenerateContext<typeof route>): frugal.PageResponse<Data> | undefined {
	if (request?.method === "POST") {
		const count = session?.get<number>("counter") ?? 0;
		session?.set("counter", count + 1);

		return new frugal.EmptyResponse({
			forceDynamic: true,
			status: 303,
			headers: {
				Location: request.url,
			},
		});
	}
}

export function render({ data }: frugal.RenderContext<typeof route, Data>) {
	return JSON.stringify(data);
}
