import { DataResponse, RenderContext } from "../../../../../packages/frugal/exports/index.js";

export const route = "/";

type Data = { foo: string };

export function build() {
	return new DataResponse(
		{ foo: "bar" },
		{
			status: 204,
			headers: {
				"my-header": "quux",
			},
		},
	);
}

export function render({ data }: RenderContext<typeof route, Data>) {
	return `${data.foo}`;
}
