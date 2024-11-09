import { PageResponse, type RenderContext } from "../../../../../exports/page/index.js";

export const route = "/page1";

const name = ["ar", "az"];

export async function build() {
	const dataURL1 = new URL(`./b${name[0]}${".txt"}`, import.meta.url);
	const dataURL2 = new URL(`./b${name[1]}${".txt"}`, import.meta.url);
	return PageResponse.data({ url1: dataURL1.toString(), url2: dataURL2.toString() });
}

export function render({ data }: RenderContext<typeof route, { url1: string; url2: string }>) {
	return JSON.stringify(data);
}
