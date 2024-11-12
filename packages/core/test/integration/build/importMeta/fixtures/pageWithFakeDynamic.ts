import { PageResponse, type RenderContext } from "../../../../../exports/page/index.js";

export const route = "/page1";

export async function build() {
	const dataURL = new URL(`${"./ba"}${"r.txt"}`, import.meta.url);
	return PageResponse.data(dataURL.toString());
}

export function render({ data }: RenderContext<typeof route, string>) {
	return data;
}
