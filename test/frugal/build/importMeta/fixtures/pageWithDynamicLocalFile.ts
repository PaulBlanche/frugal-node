import * as frugal from "../../../../../packages/frugal/exports/index.js";

export const route = "/page1";

export async function build(context: frugal.BuildContext<typeof route>) {
	const dataURL = new URL(`${"./ba"}${"r.txt"}`, import.meta.url);
	return context.data(dataURL.toString());
}

export function render({ data }: frugal.RenderContext<typeof route, string>) {
	return data;
}
