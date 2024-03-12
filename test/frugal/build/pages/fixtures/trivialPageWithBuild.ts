import { BuildContext, RenderContext } from "../../../../../packages/frugal/exports/index.js";

export const route = "/";

type Data = { foo: string };

export function build(context: BuildContext<typeof route>) {
	return context.data(
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
