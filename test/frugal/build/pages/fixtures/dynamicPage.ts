import * as frugal from "../../../../../packages/frugal/exports/page/index.js";

export const type = "dynamic";

export const route = "/";

export function generate(context: frugal.GenerateContext<typeof route>) {
	return context.data({});
}

export function render() {
	return "Hello world";
}
