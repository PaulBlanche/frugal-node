import { PathList, RenderContext } from "../../../../../packages/frugal/exports/index.js";

export const route = "/foo/:bar";

type Data = { foo: string };

export function getBuildPaths(): PathList<typeof route> {
	return [{ bar: "baz" }, { bar: "quux" }];
}

export function render({ params }: RenderContext<typeof route, Data>) {
	return `${params.bar}`;
}
