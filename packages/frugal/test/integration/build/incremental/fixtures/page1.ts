import {
	type BuildContext,
	PageResponse,
	type RenderContext,
} from "../../../../../exports/page/index.js";
import { store } from "./store.ts";

export const route = "/page1/:id";

export function getBuildPaths() {
	return [{ id: "1" }, { id: "2" }];
}

export async function build(context: BuildContext<typeof route>) {
	const dataStore = await store(new URL("./data.json", import.meta.url));
	const pageData = dataStore[0];
	return PageResponse.data(pageData[context.params.id].data, {
		headers: pageData[context.params.id].headers,
	});
}

export function render({ data, params }: RenderContext<typeof route, number>) {
	return `data: ${data}, params: ${JSON.stringify(params)}`;
}
