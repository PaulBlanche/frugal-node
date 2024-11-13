import {
	type BuildContext,
	PageResponse,
	type PathParamsList,
	type RenderContext,
} from "../../../../../exports/page/index.js";

export const route = "/:foo";

export function getBuildPaths(): PathParamsList<typeof route> {
	return [{ foo: "bar" }, { foo: "quux" }];
}

type Data = { foo: string };

export function build({ params }: BuildContext<typeof route>) {
	if (params.foo === "bar") {
		return PageResponse.data(
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
		return PageResponse.data(
			{ foo: "Hello quux" },
			{
				status: 405,
				headers: {
					"my-header-quux": "quux",
				},
			},
		);
	}

	return undefined;
}

export function render({ data }: RenderContext<typeof route, Data>) {
	return `${data.foo}`;
}
