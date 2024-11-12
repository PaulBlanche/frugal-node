import { type PathParamsList, RenderContext } from "../../../../../exports/page/index.js";

export const route = "/foo/:bar";

type Data = { foo: string };

export function getBuildPaths(): PathParamsList<typeof route> {
	return [{ bar: "baz" }, { bar: "quux" }];
}

export function render({ params }: RenderContext<typeof route, Data>) {
	return `${params.bar}`;
}
