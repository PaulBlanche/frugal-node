import { BuildContext, DataResponse, PathList, RenderContext } from "../../../../../index.js";

export const route = "/:foo";

export function getBuildPaths(): PathList<typeof route> {
	return [{ foo: "bar" }, { foo: "quux" }];
}

type Data = { foo: string };

export function build({ params }: BuildContext<typeof route>) {
	if (params.foo === "bar") {
		return new DataResponse(
			{ foo: "Hello bar" },
			{
				status: 201,
				headers: {
					"my-header-bar": "bar",
				},
			},
		);
	}
	if (params.foo === "quux") {
		return new DataResponse(
			{ foo: "Hello quux" },
			{
				status: 405,
				headers: {
					"my-header-quux": "quux",
				},
			},
		);
	}
}

export function render({ data }: RenderContext<typeof route, Data>) {
	return `${data.foo}`;
}
