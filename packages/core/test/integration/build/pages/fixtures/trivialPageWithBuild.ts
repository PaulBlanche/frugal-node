import { PageResponse, type RenderContext } from "../../../../../exports/page/index.js";

export const route = "/";

type Data = { foo: string };

export function build() {
	return PageResponse.data(
		{ foo: "bar" },
		{
			status: 204,
			headers: {
				"my-header": "quux",
			},
			maxAge: 10,
		},
	);
}

export function render({ data }: RenderContext<typeof route, Data>) {
	return `${data.foo}`;
}
